"""User schemas."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: str
    hourly_rate: Optional[float] = None
class UserCreate(UserBase):
    """User creation schema."""
    password: str
    role: UserRole = UserRole.MEMBER
class UserUpdate(BaseModel):
    """User update schema."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[UserRole] = None
    hourly_rate: Optional[float] = None
    is_active: Optional[bool] = None
class UserInDB(BaseModel):
    """User in database schema."""
    id: uuid.UUID
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    role: UserRole
    hourly_rate: Optional[float] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    class Config:
        from_attributes = True
class UserResponse(UserInDB):
    """User response schema."""
    pass
class UserStats(BaseModel):
    """User statistics."""
    assigned_tasks: int
    completed_tasks: int
    total_hours_logged: float
class UserWithStats(UserInDB):
    """User with statistics."""
    teams: list = None
    stats: Optional[UserStats] = None