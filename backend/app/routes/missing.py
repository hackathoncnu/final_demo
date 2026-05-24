import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..limiter import limiter
from ..models.missing_person import MissingPerson
from ..schemas.missing import MissingPersonResponse, MissingPersonUpdate, SectorResponse
from ..security import sanitize, safe_filename_slug, validate_image_bytes, validate_numeric_field
from ..services.ai_generator import generate_missing_person_image

# 허용 MIME 타입 및 최대 파일 크기 (5MB)
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024

router = APIRouter(prefix="/missing", tags=["missing"])


@router.post("/register", response_model=MissingPersonResponse)
@limiter.limit("5/minute")  # BruteForce 방어: IP당 분당 5회 제한
async def register_missing_person(
    request: Request,
    photo: Optional[UploadFile] = File(None),
    name: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    gender: Optional[str] = Form(None),
    height: Optional[float] = Form(None),
    weight: Optional[float] = Form(None),
    face_shape: Optional[str] = Form(None),
    hair_color: Optional[str] = Form(None),
    hair_style: Optional[str] = Form(None),
    clothing: Optional[str] = Form(None),
    missing_date: Optional[str] = Form(None),
    missing_location: Optional[str] = Form(None),
    missing_latitude: Optional[float] = Form(None),
    missing_longitude: Optional[float] = Form(None),
    missing_region: Optional[str] = Form(None),
    specific_location: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    # 문자열 SQL Injection 방어
    name = sanitize(name, "이름")
    gender = sanitize(gender, "성별")
    face_shape = sanitize(face_shape, "얼굴형")
    hair_color = sanitize(hair_color, "두발 색상")
    hair_style = sanitize(hair_style, "두발 형태")
    clothing = sanitize(clothing, "착의")
    missing_location = sanitize(missing_location, "실종 위치")
    missing_region = sanitize(missing_region, "실종 지역")
    specific_location = sanitize(specific_location, "특정 위치")

    # 숫자 범위 검증
    age = validate_numeric_field(age, 0, 120, "나이")
    height = validate_numeric_field(height, 50, 250, "키")
    weight = validate_numeric_field(weight, 10, 300, "몸무게")
    missing_latitude = validate_numeric_field(missing_latitude, -90, 90, "위도")
    missing_longitude = validate_numeric_field(missing_longitude, -180, 180, "경도")

    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)

    short_id = str(uuid.uuid4())[:8]
    name_slug = safe_filename_slug(name or "unknown")  # Path Traversal 방어

    original_photo_url: Optional[str] = None
    generated_image_url: Optional[str] = None

    if photo and photo.filename:
        # 파일 보안: MIME 화이트리스트
        if photo.content_type not in ALLOWED_MIME:
            raise HTTPException(
                status_code=400,
                detail=f"허용되지 않는 파일 형식입니다. (허용: {', '.join(ALLOWED_MIME)})",
            )
        image_bytes = await photo.read()
        # 파일 보안: 크기 제한
        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="파일 크기가 5MB를 초과합니다.")
        # 파일 보안: 매직 바이트 실제 검증 (Content-Type 위조 무력화)
        validate_image_bytes(image_bytes)

        ext = os.path.splitext(photo.filename)[1].lower() or ".jpg"
        if ext not in ALLOWED_EXT:
            ext = ".jpg"
        original_filename = f"original_{name_slug}_{short_id}{ext}"
        original_path = os.path.join(upload_dir, original_filename)
        with open(original_path, "wb") as f:
            f.write(image_bytes)
        original_photo_url = f"/static/uploads/{original_filename}"

        person_info = {
            "age": age,
            "gender": gender,
            "height": height,
            "weight": weight,
            "face_shape": face_shape,
            "hair_color": hair_color,
            "hair_style": hair_style,
            "clothing": clothing,
        }
        generated_filename = f"generated_{name_slug}_{short_id}.png"
        generated_path = os.path.join(upload_dir, generated_filename)
        try:
            mime_type = photo.content_type or "image/jpeg"
            generate_missing_person_image(
                image_bytes, mime_type, person_info, generated_path, specific_location
            )
            generated_image_url = f"/static/uploads/{generated_filename}"
        except Exception:
            # 정보 노출 방어: 내부 예외 메시지 그대로 노출 금지
            raise HTTPException(
                status_code=500,
                detail="AI 이미지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.",
            )

    missing_date_obj: Optional[datetime] = None
    if missing_date:
        try:
            missing_date_obj = datetime.fromisoformat(missing_date)
        except ValueError:
            pass

    db_person = MissingPerson(
        name=name,
        age=age,
        gender=gender,
        height=height,
        weight=weight,
        face_shape=face_shape,
        hair_color=hair_color,
        hair_style=hair_style,
        clothing=clothing,
        missing_date=missing_date_obj,
        missing_location=missing_location,
        missing_latitude=missing_latitude,
        missing_longitude=missing_longitude,
        missing_region=missing_region,
        original_photo_url=original_photo_url,
        generated_image_url=generated_image_url,
        status="수색중",
    )
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    return db_person


@router.get("", response_model=list[MissingPersonResponse])
@limiter.limit("30/minute")
def list_missing_persons(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    region: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    # Pagination 한계 검증 (Resource Exhaustion 방어)
    if skip < 0:
        raise HTTPException(status_code=400, detail="skip은 0 이상이어야 합니다.")
    if not (1 <= limit <= 100):
        raise HTTPException(status_code=400, detail="limit은 1~100 사이여야 합니다.")

    query = db.query(MissingPerson).filter(MissingPerson.is_deleted == False)
    if region:
        query = query.filter(MissingPerson.missing_region.contains(region))
    if status:
        query = query.filter(MissingPerson.status == status)
    return query.offset(skip).limit(limit).all()


@router.get("/sectors", response_model=list[SectorResponse])
@limiter.limit("30/minute")
def get_sectors(request: Request, db: Session = Depends(get_db)):
    """Flutter 앱용 섹터 목록 — lat/lng가 있는 수색중인 실종자만 반환.

    dynamic_url: 시민이 이 sector(반경 500m) 안에 진입했을 때 자동으로 띄울 URL.
    - 같은 region에 활성 실종자가 1명뿐이면 → /missing/{id} 상세 페이지
    - 2명 이상이면 → /search?region=... 검색 결과 페이지
    region은 missing_region 기준으로 카운트한다.
    """
    persons = (
        db.query(MissingPerson)
        .filter(
            MissingPerson.is_deleted == False,
            MissingPerson.status == "수색중",
            MissingPerson.missing_latitude.isnot(None),
            MissingPerson.missing_longitude.isnot(None),
        )
        .all()
    )

    region_persons: dict[str, list[MissingPerson]] = {}
    for p in persons:
        key = (p.missing_region or "").strip() or "기타"
        region_persons.setdefault(key, []).append(p)

    sectors = []
    for p in persons:
        label = p.name or "실종자"
        region_label = p.missing_region or p.missing_location or "해당 지역"
        key = (p.missing_region or "").strip() or "기타"
        same_region = region_persons.get(key, [])
        if len(same_region) <= 1:
            dyn = f"{settings.frontend_url}/missing/{p.id}"
        else:
            dyn = f"{settings.frontend_url}/search?region={key}"
        sectors.append(
            SectorResponse(
                id=f"missing-{p.id}",
                name=f"{region_label} ({label})",
                lat=p.missing_latitude,
                lng=p.missing_longitude,
                radius_m=settings.sector_radius_m,
                flyer_url=f"{settings.frontend_url}/flyer/{p.id}",
                dynamic_url=dyn,
            )
        )
    return sectors


@router.get("/{person_id}", response_model=MissingPersonResponse)
def get_missing_person(person_id: int, db: Session = Depends(get_db)):
    person = (
        db.query(MissingPerson)
        .filter(MissingPerson.id == person_id, MissingPerson.is_deleted == False)
        .first()
    )
    if not person:
        raise HTTPException(status_code=404, detail="실종자 정보를 찾을 수 없습니다")
    return person


@router.patch("/{person_id}", response_model=MissingPersonResponse)
def update_missing_person(
    person_id: int,
    update_data: MissingPersonUpdate,
    db: Session = Depends(get_db),
):
    person = (
        db.query(MissingPerson)
        .filter(MissingPerson.id == person_id, MissingPerson.is_deleted == False)
        .first()
    )
    if not person:
        raise HTTPException(status_code=404, detail="실종자 정보를 찾을 수 없습니다")

    # PATCH 입력 sanitize (SQL Injection 2중 방어) + 숫자 범위 검증
    payload = update_data.model_dump(exclude_unset=True)
    string_fields_with_labels = {
        "name": "이름",
        "gender": "성별",
        "body_type": "체형",
        "face_shape": "얼굴형",
        "hair_color": "두발 색상",
        "hair_style": "두발 형태",
        "clothing": "착의",
        "missing_location": "실종 위치",
        "missing_region": "실종 지역",
        "medical_condition": "의학적 상태",
        "status": "상태",
    }
    for field, label in string_fields_with_labels.items():
        if field in payload:
            payload[field] = sanitize(payload[field], label)

    if "age" in payload:
        payload["age"] = validate_numeric_field(payload["age"], 0, 120, "나이")
    if "age_at_missing" in payload:
        payload["age_at_missing"] = validate_numeric_field(payload["age_at_missing"], 0, 120, "실종 당시 나이")
    if "height" in payload:
        payload["height"] = validate_numeric_field(payload["height"], 50, 250, "키")
    if "weight" in payload:
        payload["weight"] = validate_numeric_field(payload["weight"], 10, 300, "몸무게")
    if "missing_latitude" in payload:
        payload["missing_latitude"] = validate_numeric_field(payload["missing_latitude"], -90, 90, "위도")
    if "missing_longitude" in payload:
        payload["missing_longitude"] = validate_numeric_field(payload["missing_longitude"], -180, 180, "경도")

    for field, value in payload.items():
        setattr(person, field, value)

    db.commit()
    db.refresh(person)
    return person


@router.delete("/{person_id}")
def delete_missing_person(person_id: int, db: Session = Depends(get_db)):
    person = (
        db.query(MissingPerson)
        .filter(MissingPerson.id == person_id, MissingPerson.is_deleted == False)
        .first()
    )
    if not person:
        raise HTTPException(status_code=404, detail="실종자 정보를 찾을 수 없습니다")

    person.is_deleted = True
    db.commit()
    return {"message": "삭제 완료"}
