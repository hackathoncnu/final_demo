import io
import json
import os
import re
from typing import Optional

from google import genai
from google.genai import types
from PIL import Image, ImageDraw, ImageFont


MODEL_ID = "gemini-3-pro-image-preview"
EVAL_MODEL_ID = "gemini-2.0-flash"
MAX_ATTEMPTS = 3
SIMILARITY_THRESHOLD = 90.0


def _build_prompt(person_info: dict, specific_location: Optional[str]) -> str:
    parts = []
    if person_info.get("age"):
        parts.append(f"{person_info['age']}세")
    if person_info.get("gender"):
        parts.append(person_info["gender"])
    if person_info.get("height"):
        parts.append(f"키 약 {person_info['height']}cm")
    if person_info.get("weight"):
        parts.append(f"몸무게 약 {person_info['weight']}kg")
    if person_info.get("face_shape"):
        parts.append(f"{person_info['face_shape']} 얼굴형")
    if person_info.get("hair_color") or person_info.get("hair_style"):
        hair = " ".join(filter(None, [person_info.get("hair_color"), person_info.get("hair_style")]))
        parts.append(f"{hair} 머리")
    if person_info.get("clothing"):
        parts.append(f"{person_info['clothing']} 착용")

    person_desc = ", ".join(parts) if parts else "신체 정보 없음"

    if specific_location:
        prompt = f"""첨부된 사진 속 인물과 동일한 얼굴을 가진 사람의 전신 사진을 생성해주세요.

인물 정보: {person_desc}

스타일: 정면을 바라보는 전신 사진
배경: {specific_location} (해당 장소의 실제 환경을 사실적으로 표현)

주의사항:
- 첨부 사진의 얼굴을 정확히 유지할 것
- 임의로 흉터, 점 등 신체 특징 추가 금지
- 착의 정보를 반드시 반영할 것"""
    else:
        prompt = f"""첨부된 사진 속 인물과 동일한 얼굴을 가진 사람의 전신 사진을 생성해주세요.

인물 정보: {person_desc}

스타일: 정면을 바라보는 전신 사진, 흰색 또는 밝은 단색 배경

주의사항:
- 첨부 사진의 얼굴을 정확히 유지할 것
- 임의로 흉터, 점 등 신체 특징 추가 금지
- 착의 정보를 반드시 반영할 것"""

    return prompt


def _add_watermark(image_bytes: bytes) -> bytes:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    text = "AI 생성"
    font_size = max(20, img.width // 20)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except OSError:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    margin = 12
    x = img.width - text_w - margin
    y = img.height - text_h - margin

    draw.rectangle([x - 4, y - 4, x + text_w + 4, y + text_h + 4], fill=(0, 0, 0, 120))
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 230))

    result = Image.alpha_composite(img, overlay).convert("RGB")
    buf = io.BytesIO()
    result.save(buf, format="PNG")
    return buf.getvalue()


def _evaluate_similarity(
    original_bytes: bytes,
    generated_bytes: bytes,
    original_mime_type: str,
    client: genai.Client,
) -> float:
    """원본 이미지와 생성 이미지의 얼굴 유사도를 0-100 점수로 반환. 실패 시 0.0."""
    eval_prompt = (
        "두 이미지를 비교하세요. 첫 번째는 원본 사진, 두 번째는 AI가 생성한 이미지입니다.\n"
        "얼굴의 유사도를 0에서 100 사이의 점수로 평가하세요.\n"
        '반드시 JSON 형식으로만 응답하세요: {"similarity_score": <숫자>}\n'
        "다른 텍스트는 포함하지 마세요."
    )

    try:
        response = client.models.generate_content(
            model=EVAL_MODEL_ID,
            contents=[
                eval_prompt,
                types.Part.from_bytes(data=original_bytes, mime_type=original_mime_type),
                types.Part.from_bytes(data=generated_bytes, mime_type="image/png"),
            ],
        )

        if not response.candidates:
            return 0.0

        raw_text = ""
        content = response.candidates[0].content
        for part in (content.parts if content is not None else []):
            if part.text:
                raw_text += part.text

        try:
            data = json.loads(raw_text.strip())
            return float(data.get("similarity_score", 0))
        except (json.JSONDecodeError, ValueError, KeyError):
            pass

        match = re.search(r"\b(\d{1,3}(?:\.\d+)?)\b", raw_text)
        if match:
            return min(float(match.group(1)), 100.0)

        return 0.0
    except Exception:
        return 0.0


def generate_missing_person_image(
    image_bytes: bytes,
    mime_type: str,
    person_info: dict,
    output_path: str,
    specific_location: Optional[str] = None,
) -> str:
    """실종자 사진 + 정보로 예상 전신 이미지 생성. Returns: 저장된 이미지 파일 경로."""
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY 또는 GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")
    client = genai.Client(vertexai=True, api_key=api_key)
    prompt = _build_prompt(person_info, specific_location)

    best_score = -1.0
    best_image_bytes: Optional[bytes] = None
    threshold_met = False

    for attempt in range(1, MAX_ATTEMPTS + 1):
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            ],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )

        if not response.candidates:
            print(f"[시도 {attempt}/{MAX_ATTEMPTS}] 이미지 생성 응답 없음, 재시도...")
            continue

        candidate = response.candidates[0]
        if candidate.finish_reason != types.FinishReason.STOP:
            print(f"[시도 {attempt}/{MAX_ATTEMPTS}] 생성 실패: {candidate.finish_reason}, 재시도...")
            continue

        if candidate.content is None:
            print(f"[시도 {attempt}/{MAX_ATTEMPTS}] 응답 content 없음, 재시도...")
            continue

        generated_bytes: Optional[bytes] = None
        for part in candidate.content.parts or []:
            if part.thought:
                continue
            if part.inline_data and part.inline_data.data:
                generated_bytes = part.inline_data.data
                break

        if generated_bytes is None:
            print(f"[시도 {attempt}/{MAX_ATTEMPTS}] 응답에 이미지 데이터 없음, 재시도...")
            continue

        score = _evaluate_similarity(image_bytes, generated_bytes, mime_type, client)
        print(f"[시도 {attempt}/{MAX_ATTEMPTS}] 유사도 점수: {score:.1f}/100")

        if score > best_score:
            best_score = score
            best_image_bytes = generated_bytes

        if score >= SIMILARITY_THRESHOLD:
            print(f"[시도 {attempt}/{MAX_ATTEMPTS}] 유사도 {score:.1f}% 달성 — 이미지 저장")
            threshold_met = True
            break

    if best_image_bytes is None:
        raise ValueError("모든 시도에서 이미지 생성에 실패했습니다.")

    if not threshold_met:
        print(f"[완료] {MAX_ATTEMPTS}회 시도 후 최고 유사도 {best_score:.1f}% 이미지 사용")

    watermarked = _add_watermark(best_image_bytes)
    dir_path = os.path.dirname(output_path)
    if dir_path:
        os.makedirs(dir_path, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(watermarked)
    return output_path
