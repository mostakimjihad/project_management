"""Authentication routes."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User, UserRole, ApprovalStatus
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, Token
from app.schemas.user import UserResponse, UserCreate
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.dependencies import get_current_user, get_current_active_user
from app.config import settings


router = APIRouter(tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    user_data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user. User will be pending approval by default."""
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )
    
    # Create user with pending approval status
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role or UserRole.MEMBER,
        hourly_rate=user_data.hourly_rate,
        approval_status=ApprovalStatus.PENDING,
        is_active=True,  # Will be activated upon approval
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login user."""
    # Find user
    result = await db.execute(
        select(User).where(User.email == credentials.email)
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    
    # Check approval status
    if user.approval_status == ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=403,
            detail="Your account is pending approval. Please wait for an administrator to approve your account."
        )
    
    if user.approval_status == ApprovalStatus.REJECTED:
        raise HTTPException(
            status_code=403,
            detail=f"Your account was rejected. Reason: {user.rejection_reason or 'Not specified'}"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is disabled"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Create tokens
    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id), "role": user.role})
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token."""
    payload = decode_token(refresh_token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token"
        )
    
    # Create new access token
    access_token = create_access_token({"sub": payload.sub, "role": payload.role})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user."""
    user_id = current_user["sub"]
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)