import io
import re

from fastapi import HTTPException
from PIL import Image

# SQL Injection 패턴: DDL/DML 키워드, 주석, 따옴표, 세미콜론 탐지
_SQL_PATTERN = re.compile(
    r"(--|;|/\*|\*/|'|\"|"
    r"\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE|CAST|CONVERT|DECLARE|XP_)\b)",
    re.IGNORECASE,
)

# 알파벳/숫자/한글이 아닌 모든 문자 → _ 로 치환 (Path Traversal 방어용)
_UNSAFE_FILENAME_PATTERN = re.compile(r"[^\w가-힣]", re.UNICODE)

MAX_FIELD_LENGTH = 200


def sanitize(value: str | None, field_name: str = "입력값") -> str | None:
    """SQL Injection 패턴 탐지 및 길이 제한."""
    if value is None:
        return None
    if len(value) > MAX_FIELD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} 값이 너무 깁니다 (최대 {MAX_FIELD_LENGTH}자).",
        )
    if _SQL_PATTERN.search(value):
        raise HTTPException(
            status_code=400,
            detail=f"{field_name}에 허용되지 않는 문자 또는 SQL 구문이 포함되어 있습니다.",
        )
    return value.strip()


def validate_numeric_field(
    value: float | int | None,
    min_val: float | int,
    max_val: float | int,
    field_name: str,
) -> float | int | None:
    """숫자 필드 범위 검증 (Integer Overflow / 비정상 값 방지)."""
    if value is None:
        return None
    if not (min_val <= value <= max_val):
        raise HTTPException(
            status_code=400,
            detail=f"{field_name}은(는) {min_val}~{max_val} 범위여야 합니다.",
        )
    return value


def validate_image_bytes(image_bytes: bytes) -> None:
    """실제 이미지 바이트를 PIL로 파싱해 매직 바이트 검증 (MIME Spoofing 방어)."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="유효하지 않은 이미지 파일입니다.",
        )


def safe_filename_slug(name: str) -> str:
    """파일명에 쓸 슬러그 생성 — 알파벳/숫자/한글 외 문자는 _로 치환, 최대 50자."""
    cleaned = _UNSAFE_FILENAME_PATTERN.sub("_", name)[:50]
    return cleaned or "unknown"
