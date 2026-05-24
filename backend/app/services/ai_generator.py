import io
import os
from typing import Optional

from google import genai
from google.genai import types
from PIL import Image, ImageDraw, ImageFont


MODEL_ID = "gemini-3-pro-image-preview"


def _build_prompt(person_info: dict, specific_location: Optional[str]) -> str:
    # 신체 정보 문장 조합
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
        # 프롬프트 1: 실종 장소를 알 때 — 해당 장소 배경
        prompt = f"""첨부된 사진 속 인물과 동일한 얼굴을 가진 사람의 전신 사진을 생성해주세요.

인물 정보: {person_desc}

스타일: 정면을 바라보는 전신 사진
배경: {specific_location} (해당 장소의 실제 환경을 사실적으로 표현)
인물 정보 : {person_desc}
주의사항:
- 첨부 사진의 얼굴을 정확히 유지할 것
- 임의로 흉터, 점 등 신체 특징 추가 금지
- 착의 정보를 반드시 반영할 것"""
    else:
        # 프롬프트 2: 실종 장소 모를 때 — 배경 없이 깔끔한 전신
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
        raise ValueError("이미지 생성 응답 없음")

    candidate = response.candidates[0]
    if candidate.finish_reason != types.FinishReason.STOP:
        raise ValueError(f"생성 실패: {candidate.finish_reason}")

    if candidate.content is None:
        raise ValueError("응답 content 없음")

    parts = candidate.content.parts or []
    for part in parts:
        if part.thought:
            continue
        if part.inline_data and part.inline_data.data:
            watermarked = _add_watermark(part.inline_data.data)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(watermarked)
            return output_path

    raise ValueError("응답에 이미지 데이터가 없습니다.")
