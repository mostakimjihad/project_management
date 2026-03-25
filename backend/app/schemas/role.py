"""Role and Permission schemas."""
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Permission Schemas
class PermissionBase(BaseModel):
    """Base permission schema."""
    name: str = Field(..., description="Permission name e.g., 'projects:create'")
    display_name: str = Field(..., description="Human readable name e.g., 'Create Projects'")
    description: Optional[str] = None
    module: str = Field(..., description="Module name e.g., 'projects', 'tasks'")
    action: str = Field(..., description="Action e.g., 'create', 'read', 'update', 'delete'")


class PermissionCreate(PermissionBase):
    """Permission creation schema."""
    pass


class PermissionUpdate(BaseModel):
    """Permission update schema."""
    display_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class PermissionResponse(PermissionBase):
    """Permission response schema."""
    id: uuid.UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Role Schemas
class RoleBase(BaseModel):
    """Base role schema."""
    name: str = Field(..., description="Role name e.g., 'project_manager'")
    display_name: str = Field(..., description="Human readable name e.g., 'Project Manager'")
    description: Optional[str] = None


class RoleCreate(RoleBase):
    """Role creation schema."""
    permission_ids: Optional[List[uuid.UUID]] = Field(default=[], description="List of permission IDs to assign")


class RoleUpdate(BaseModel):
    """Role update schema."""
    display_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    permission_ids: Optional[List[uuid.UUID]] = None


class RoleResponse(RoleBase):
    """Role response schema."""
    id: uuid.UUID
    is_system: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True


class RoleBrief(BaseModel):
    """Brief role info for nested responses."""
    id: uuid.UUID
    name: str
    display_name: str

    class Config:
        from_attributes = True


# User Role Assignment Schemas
class UserRoleAssign(BaseModel):
    """Schema for assigning roles to user."""
    role_ids: List[uuid.UUID] = Field(..., description="List of role IDs to assign")


class UserRoleRemove(BaseModel):
    """Schema for removing roles from user."""
    role_ids: List[uuid.UUID] = Field(..., description="List of role IDs to remove")


# Bulk Permission Schemas
class PermissionModulesResponse(BaseModel):
    """Response for permissions grouped by module."""
    module: str
    permissions: List[PermissionResponse]


class RoleWithUsersResponse(RoleResponse):
    """Role response with user count."""
    user_count: int = 0