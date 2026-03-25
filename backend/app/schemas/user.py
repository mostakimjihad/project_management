"""User schemas."""
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole, ApprovalStatus


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: str
    hourly_rate: Optional[float] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.MEMBER


class UserUpdate(BaseModel):
    """User update schema."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[UserRole] = None
    hourly_rate: Optional[float] = None
    is_active: Optional[bool] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None


class UserProfileUpdate(BaseModel):
    """Schema for user updating their own profile."""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None


class UserInDB(BaseModel):
    """User in database schema."""
    id: uuid.UUID
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    role: UserRole
    hourly_rate: Optional[float] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    
    # Approval status
    approval_status: ApprovalStatus
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserResponse(UserInDB):
    """User response schema."""
    pass


class UserWithRoles(UserResponse):
    """User response with custom roles."""
    custom_roles: List = []


class UserPendingResponse(BaseModel):
    """Response for pending user approval list."""
    id: uuid.UUID
    email: str
    full_name: str
    job_title: Optional[str] = None
    department: Optional[str] = None
    created_at: datetime
    approval_status: ApprovalStatus

    class Config:
        from_attributes = True


class UserApproval(BaseModel):
    """Schema for approving/rejecting a user."""
    approve: bool = Field(..., description="True to approve, False to reject")
    role: Optional[UserRole] = Field(default=UserRole.MEMBER, description="Role to assign if approved")
    rejection_reason: Optional[str] = Field(None, description="Reason for rejection if rejected")


class UserStats(BaseModel):
    """User statistics."""
    assigned_tasks: int
    completed_tasks: int
    total_hours_logged: float


class UserWithStats(UserInDB):
    """User with statistics."""
    teams: list = None
    stats: Optional[UserStats] = None


class UserRoleUpdate(BaseModel):
    """Schema for updating user's system role."""
    role: UserRole
