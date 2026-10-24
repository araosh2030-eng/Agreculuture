from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- Auth Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Schedule Schemas ---
class PlantScheduleCreate(BaseModel):
    name: str
    interval_days: int

class PlantScheduleResponse(BaseModel):
    id: int
    name: str
    interval_days: int
    moisture_level: float
    last_watered: datetime
    owner_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- Community Schemas ---
class CommunityPostCreate(BaseModel):
    content: str
    author_name: Optional[str] = "عضو جديد"

class CommunityPostResponse(BaseModel):
    id: int
    content: str
    likes: int
    created_at: datetime
    author_name: str

    class Config:
        from_attributes = True

# --- Plant Doctor Schemas ---
class DoctorDiagnosisResponse(BaseModel):
    filename: str
    confidence: float
    disease_name: str
    symptoms: str
    treatment: List[str]
