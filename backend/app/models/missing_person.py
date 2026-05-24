from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.sql import func
from ..database import Base


class MissingPerson(Base):
    __tablename__ = "missing_persons"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    age_at_missing = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    body_type = Column(String, nullable=True)
    face_shape = Column(String, nullable=True)
    hair_color = Column(String, nullable=True)
    hair_style = Column(String, nullable=True)
    clothing = Column(Text, nullable=True)
    missing_date = Column(DateTime, nullable=True)
    missing_location = Column(String, nullable=True)
    missing_latitude = Column(Float, nullable=True)
    missing_longitude = Column(Float, nullable=True)
    missing_region = Column(String, nullable=True)
    medical_condition = Column(String, nullable=True)
    original_photo_url = Column(String, nullable=True)
    generated_image_url = Column(String, nullable=True)
    status = Column(String, default="수색중")
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
