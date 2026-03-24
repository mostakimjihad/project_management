"""User routes."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.common import PaginatedResponse
from app.dependencies import get_current_active_user


router = APIRouter(tags=["Users"])


@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """List users with pagination."""
    query = select(User).where(User.is_active == True)
    
    if search:
        query = query.where(User.full_name.ilike(f"%{search}%"))
    
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return PaginatedResponse.create(
        items=users,
        total=len(users),
        page=page,
        limit=limit,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Get user by ID."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Update user."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for field, value in user_data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    return UserResponse.model_validate(user)