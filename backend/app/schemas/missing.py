from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SectorResponse(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    radius_m: float
    flyer_url: str
    dynamic_url: Optional[str] = None


class MissingPersonCreate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    face_shape: Optional[str] = None
    hair_color: Optional[str] = None
    hair_style: Optional[str] = None
    clothing: Optional[str] = None
    missing_date: Optional[datetime] = None
    missing_location: Optional[str] = None
    missing_region: Optional[str] = None
    status: str = "수색중"


class MissingPersonUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    age_at_missing: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    body_type: Optional[str] = None
    face_shape: Optional[str] = None
    hair_color: Optional[str] = None
    hair_style: Optional[str] = None
    clothing: Optional[str] = None
    missing_date: Optional[datetime] = None
    missing_location: Optional[str] = None
    missing_latitude: Optional[float] = None
    missing_longitude: Optional[float] = None
    missing_region: Optional[str] = None
    medical_condition: Optional[str] = None
    status: Optional[str] = None


class MissingPersonResponse(BaseModel):
    id: int
    name: Optional[str] = None
    age: Optional[int] = None
    age_at_missing: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    body_type: Optional[str] = None
    face_shape: Optional[str] = None
    hair_color: Optional[str] = None
    hair_style: Optional[str] = None
    clothing: Optional[str] = None
    missing_date: Optional[datetime] = None
    missing_location: Optional[str] = None
    missing_latitude: Optional[float] = None
    missing_longitude: Optional[float] = None
    missing_region: Optional[str] = None
    medical_condition: Optional[str] = None
    original_photo_url: Optional[str] = None
    generated_image_url: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
