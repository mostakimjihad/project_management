"""Authentication schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole
from app.schemas.user import UserBase, UserResponse


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[datetime] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    avatar_url: Optional[str] = None
    role: Optional[UserRole] = UserRole.MEMBER
    hourly_rate: Optional[float] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    avatar_url: Optional[str] = None
    role: UserRole = UserRole.MEMBER
    hourly_rate: Optional[float] = None