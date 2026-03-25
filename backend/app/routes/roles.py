"""Role and Permission management routes."""
import uuid
from typing import Optional, List
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.role import Role, Permission
from app.models.user import User, UserRole
from app.schemas.role import (
    PermissionCreate,
    PermissionUpdate,
    PermissionResponse,
    RoleCreate,
    RoleUpdate,
    RoleResponse,
    RoleBrief,
    UserRoleAssign,
    UserRoleRemove,
    PermissionModulesResponse,
    RoleWithUsersResponse,
)
from app.schemas.common import PaginatedResponse
from app.schemas.user import UserResponse, UserPendingResponse, UserApproval, UserRoleUpdate
from app.dependencies import get_current_active_user, require_admin, get_current_user_entity
from datetime import datetime


router = APIRouter(tags=["Roles & Permissions"])


# ==================== Permission Endpoints ====================

@router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(
    module: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """List all permissions, optionally filtered by module."""
    query = select(Permission).where(Permission.is_active == True)
    
    if module:
        query = query.where(Permission.module == module)
    
    query = query.order_by(Permission.module, Permission.action)
    
    result = await db.execute(query)
    permissions = result.scalars().all()
    
    return permissions


@router.get("/permissions/by-module", response_model=List[PermissionModulesResponse])
async def list_permissions_by_module(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """List permissions grouped by module."""
    result = await db.execute(
        select(Permission).where(Permission.is_active == True).order_by(Permission.module, Permission.action)
    )
    permissions = result.scalars().all()
    
    # Group by module
    grouped = defaultdict(list)
    for perm in permissions:
        grouped[perm.module].append(PermissionResponse.model_validate(perm))
    
    return [
        PermissionModulesResponse(module=module, permissions=perms)
        for module, perms in sorted(grouped.items())
    ]


@router.post("/permissions", response_model=PermissionResponse, status_code=201)
async def create_permission(
    permission_data: PermissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Create a new permission."""
    # Check if permission name already exists
    result = await db.execute(
        select(Permission).where(Permission.name == permission_data.name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Permission '{permission_data.name}' already exists"
        )
    
    permission = Permission(
        name=permission_data.name,
        display_name=permission_data.display_name,
        description=permission_data.description,
        module=permission_data.module,
        action=permission_data.action,
    )
    db.add(permission)
    await db.commit()
    await db.refresh(permission)
    
    return permission


@router.put("/permissions/{permission_id}", response_model=PermissionResponse)
async def update_permission(
    permission_id: str,
    permission_data: PermissionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Update a permission."""
    result = await db.execute(
        select(Permission).where(Permission.id == permission_id)
    )
    permission = result.scalar_one_or_none()
    
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    for field, value in permission_data.model_dump(exclude_unset=True).items():
        setattr(permission, field, value)
    
    await db.commit()
    await db.refresh(permission)
    
    return permission


@router.delete("/permissions/{permission_id}", status_code=204)
async def delete_permission(
    permission_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Delete (deactivate) a permission."""
    result = await db.execute(
        select(Permission).where(Permission.id == permission_id)
    )
    permission = result.scalar_one_or_none()
    
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    permission.is_active = False
    await db.commit()
    
    return None


# ==================== Role Endpoints ====================

@router.get("", response_model=PaginatedResponse[RoleResponse])
async def list_roles(
    page: int = 1,
    limit: int = 10,
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """List all roles with pagination."""
    query = select(Role).options(selectinload(Role.permissions))
    
    if not include_inactive:
        query = query.where(Role.is_active == True)
    
    # Get total count
    count_query = select(func.count()).select_from(Role)
    if not include_inactive:
        count_query = count_query.where(Role.is_active == True)
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset((page - 1) * limit).limit(limit).order_by(Role.created_at.desc())
    
    result = await db.execute(query)
    roles = result.scalars().unique().all()
    
    return PaginatedResponse.create(
        items=[RoleResponse.model_validate(role) for role in roles],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/all", response_model=List[RoleBrief])
async def list_all_roles(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Get brief list of all active roles for dropdowns."""
    result = await db.execute(
        select(Role).where(Role.is_active == True).order_by(Role.display_name)
    )
    roles = result.scalars().all()
    return roles


@router.get("/{role_id}", response_model=RoleWithUsersResponse)
async def get_role(
    role_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Get role by ID with user count."""
    result = await db.execute(
        select(Role).where(Role.id == role_id)
    )
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Count users with this role
    from app.models.role import user_roles
    count_result = await db.execute(
        select(func.count()).where(user_roles.c.role_id == role_id)
    )
    user_count = count_result.scalar() or 0
    
    response = RoleWithUsersResponse.model_validate(role)
    response.user_count = user_count
    
    return response


@router.post("", response_model=RoleResponse, status_code=201)
async def create_role(
    role_data: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Create a new role with permissions."""
    # Check if role name already exists
    result = await db.execute(
        select(Role).where(Role.name == role_data.name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Role '{role_data.name}' already exists"
        )
    
    role = Role(
        name=role_data.name,
        display_name=role_data.display_name,
        description=role_data.description,
    )
    
    # Assign permissions if provided
    if role_data.permission_ids:
        perm_result = await db.execute(
            select(Permission).where(Permission.id.in_(role_data.permission_ids))
        )
        permissions = perm_result.scalars().all()
        role.permissions = list(permissions)
    
    db.add(role)
    await db.commit()
    await db.refresh(role)
    
    return role


@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: str,
    role_data: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Update a role."""
    result = await db.execute(
        select(Role).where(Role.id == role_id)
    )
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role.is_system:
        raise HTTPException(
            status_code=400,
            detail="Cannot modify system roles"
        )
    
    # Update basic fields
    update_data = role_data.model_dump(exclude_unset=True)
    permission_ids = update_data.pop('permission_ids', None)
    
    for field, value in update_data.items():
        setattr(role, field, value)
    
    # Update permissions if provided
    if permission_ids is not None:
        perm_result = await db.execute(
            select(Permission).where(Permission.id.in_(permission_ids))
        )
        permissions = perm_result.scalars().all()
        role.permissions = list(permissions)
    
    await db.commit()
    await db.refresh(role)
    
    return role


@router.delete("/{role_id}", status_code=204)
async def delete_role(
    role_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Delete (deactivate) a role."""
    result = await db.execute(
        select(Role).where(Role.id == role_id)
    )
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role.is_system:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete system roles"
        )
    
    role.is_active = False
    await db.commit()
    
    return None


# ==================== User Role Assignment Endpoints ====================

@router.post("/users/{user_id}/assign", response_model=UserResponse)
async def assign_roles_to_user(
    user_id: str,
    assignment: UserRoleAssign,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Assign custom roles to a user."""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    result = await db.execute(
        select(User).where(User.id == user_uuid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get roles to assign
    roles_result = await db.execute(
        select(Role).where(Role.id.in_(assignment.role_ids), Role.is_active == True)
    )
    roles = roles_result.scalars().all()
    
    # Add new roles (avoid duplicates)
    existing_role_ids = {str(r.id) for r in user.custom_roles}
    for role in roles:
        if str(role.id) not in existing_role_ids:
            user.custom_roles.append(role)
    
    await db.commit()
    await db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.post("/users/{user_id}/remove", response_model=UserResponse)
async def remove_roles_from_user(
    user_id: str,
    removal: UserRoleRemove,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Remove custom roles from a user."""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    result = await db.execute(
        select(User).where(User.id == user_uuid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove specified roles
    user.custom_roles = [
        role for role in user.custom_roles
        if str(role.id) not in removal.role_ids
    ]
    
    await db.commit()
    await db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.put("/users/{user_id}/system-role", response_model=UserResponse)
async def update_user_system_role(
    user_id: str,
    role_update: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Update a user's system role (admin, manager, member)."""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    result = await db.execute(
        select(User).where(User.id == user_uuid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role_update.role
    await db.commit()
    await db.refresh(user)
    
    return UserResponse.model_validate(user)


# ==================== User Approval Endpoints ====================

@router.get("/users/pending", response_model=PaginatedResponse[UserPendingResponse])
async def list_pending_users(
    page: int = 1,
    limit: int = 10,
    status_filter: Optional[str] = "pending",
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """List users pending approval."""
    from app.models.user import ApprovalStatus
    
    query = select(User)
    
    if status_filter == "pending":
        query = query.where(User.approval_status == ApprovalStatus.PENDING)
    elif status_filter == "all":
        pass  # Show all
    else:
        query = query.where(User.approval_status == ApprovalStatus.PENDING)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset((page - 1) * limit).limit(limit).order_by(User.created_at.desc())
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return PaginatedResponse.create(
        items=[UserPendingResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        limit=limit,
    )


@router.post("/users/{user_id}/approve", response_model=UserResponse)
async def approve_reject_user(
    user_id: str,
    approval: UserApproval,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_entity),
):
    """Approve or reject a pending user."""
    from app.models.user import ApprovalStatus
    
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    result = await db.execute(
        select(User).where(User.id == user_uuid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.approval_status != ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"User is already {user.approval_status.value}"
        )
    
    if approval.approve:
        user.approval_status = ApprovalStatus.APPROVED
        user.approved_by = current_user.id
        user.approved_at = datetime.utcnow()
        user.rejection_reason = None
        user.role = approval.role
        user.is_active = True
    else:
        if not approval.rejection_reason:
            raise HTTPException(
                status_code=400,
                detail="Rejection reason is required when rejecting a user"
            )
        user.approval_status = ApprovalStatus.REJECTED
        user.rejection_reason = approval.rejection_reason
        user.approved_by = current_user.id
        user.approved_at = datetime.utcnow()
        user.is_active = False
    
    await db.commit()
    await db.refresh(user)
    
    return UserResponse.model_validate(user)