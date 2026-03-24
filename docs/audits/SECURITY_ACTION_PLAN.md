# Security Action Plan

**Project:** Project Management Application  
**Created:** March 23, 2026  
**Priority:** Critical  

---

## Overview

This document outlines the security improvements required before production deployment. Items are prioritized by severity and impact.

---

## 🔴 Critical Priority (Fix Immediately)

### 1. Environment-Based Secret Key Configuration

**Current Issue:**
```python
# backend/app/config.py
SECRET_KEY: str = "your-super-secret-key-change-in-production-please"
```

**Risk:** Anyone with access to the codebase can forge JWT tokens, This allows complete account takeover, data breaches, and unauthorized access.

**Solution:**

```python
# backend/app/config.py
import os
from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    APP_NAME: str = "Project Management API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False  # Default to False for security
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./project_management.db"
    
    # JWT Settings - MUST be set via environment variable in production
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate SECRET_KEY in production
        if not self.SECRET_KEY:
            raise ValueError(
                "SECRET_KEY environment variable must be set. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
            )
        if not self.DEBUG and self.SECRET_KEY == "dev-key-please-change":
            raise ValueError("DEV secret key cannot be used in production mode")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
```

**Create `.env.example`:**
```env
# Application
DEBUG=false
APP_NAME=Project Management API
APP_VERSION=1.0.0

# Database (PostgreSQL for production)
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/project_management

# JWT Settings - Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-generated-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS (comma-separated for multiple origins)
CORS_ORIGINS=["https://yourdomain.com"]
```

**Files to Create/Modify:**
- `backend/app/config.py` - Update settings class
- `backend/.env.example` - Create example environment file
- `backend/.env` - Create actual .env file (add to .gitignore)
- `.gitignore` - Ensure .env is ignored

---

### 2. Resource-Level Authorization

**Current Issue:**
Any authenticated user can delete any project, task, or team - even if they don't own it.

**Solution:**

```python
# backend/app/dependencies.py - Add authorization helpers

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.utils.security import decode_token
from app.schemas.auth import TokenPayload
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.team import Team, TeamMember, TeamMemberRole


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: AsyncSession = Depends(get_db),
) -> Optional[TokenPayload]:
    """Get current user from JWT token."""
    token = credentials.credentials
    if not token:
        return None
    
    payload = decode_token(token)
    if not payload:
        return None
    
    return payload


def get_current_active_user(
    payload: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get current active user and verify they exist."""
    if not payload:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {"sub": payload.sub, "role": payload.role}


async def get_current_user_entity(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get the full User entity from database."""
    result = await db.execute(
        select(User).where(User.id == current_user["sub"])
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    return user


def require_admin(
    current_user: dict = Depends(get_current_active_user),
) -> dict:
    """Require admin role."""
    if current_user["role"] != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_manager_or_admin(
    current_user: dict = Depends(get_current_active_user),
) -> dict:
    """Require manager or admin role."""
    if current_user["role"] not in [UserRole.ADMIN.value, UserRole.MANAGER.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager or admin access required"
        )
    return current_user


async def verify_project_access(
    project_id: str,
    user: dict,
    db: AsyncSession,
    require_edit: bool = False,
) -> Project:
    """Verify user has access to the project.
    
    Args:
        project_id: UUID of the project
        user: Current user dict with 'sub' and 'role'
        db: Database session
        require_edit: If True, requires edit permission (creator, team lead, or admin)
    
    Returns:
        Project entity
        
    Raises:
        HTTPException: 404 if not found, 403 if no access
    """
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Admins have full access
    if user["role"] == UserRole.ADMIN.value:
        return project
    
    # Creator has full access
    if str(project.created_by) == user["sub"]:
        return project
    
    if require_edit:
        # For edit operations, check if user is team lead of project's team
        if project.team_id:
            member_result = await db.execute(
                select(TeamMember).where(
                    TeamMember.team_id == project.team_id,
                    TeamMember.user_id == user["sub"],
                    TeamMember.role == TeamMemberRole.LEAD
                )
            )
            if member_result.scalar_one_or_none():
                return project
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this project"
        )
    
    # Read access: team members can view
    if project.team_id:
        member_result = await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == project.team_id,
                TeamMember.user_id == user["sub"]
            )
        )
        if member_result.scalar_one_or_none():
            return project
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You don't have access to this project"
    )
```

**Apply to Routes:**
```python
# backend/app/routes/projects.py

from app.dependencies import verify_project_access

@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Delete project - requires ownership or admin."""
    project = await verify_project_access(
        project_id, current_user, db, require_edit=True
    )
    
    await db.delete(project)
    await db.commit()
```

---

### 3. Rate Limiting

**Current Issue:**
No protection against brute force login attempts or API abuse.

**Solution:**

```python
# backend/app/main.py - Add rate limiting

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Create limiter
limiter = Limiter(key_func=get_remote_address)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."}
    )

# Apply to auth routes
from app.routes.auth import router as auth_router

# In auth.py:
from slowapi import limiter

@router.post("/login")
@limiter.limit("5/minute")  # 5 login attempts per minute
async def login(...):
    pass

@router.post("/register")
@limiter.limit("3/minute")  # 3 registrations per minute
async def register(...):
    pass
```

**Add to requirements.txt:**
```
slowapi>=0.1.9
```

---

## 🟡 Medium Priority (Fix Before Launch)

### 4. Input Sanitization

**Issue:** While Pydantic validates input structure, HTML/script injection in text fields isn't explicitly prevented.

**Solution:**
```python
# backend/app/utils/sanitize.py

import re
from typing import Optional

def sanitize_input(text: Optional[str]) -> Optional[str]:
    """Remove potentially dangerous HTML/script content."""
    if text is None:
        return None
    
    # Remove script tags
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove event handlers
    text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)
    
    # Remove javascript: URLs
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    
    return text.strip()


# Apply in schemas
from pydantic import field_validator

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    
    @field_validator('name', 'description')
    @classmethod
    def sanitize_fields(cls, v: Optional[str]) -> Optional[str]:
        from app.utils.sanitize import sanitize_input
        return sanitize_input(v)
```

---

### 5. Secure Headers

**Add security headers middleware:**
```python
# backend/app/main.py

from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

# Only in production
if not settings.DEBUG:
    app.add_middleware(HTTPSRedirectMiddleware)
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=["yourdomain.com", "*.yourdomain.com"]
    )

# Add security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

---

### 6. Logging & Audit Trail

**Add comprehensive logging:**
```python
# backend/app/utils/logging.py

import logging
import sys
from datetime import datetime
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        # Add file handler for production
        *([] if settings.DEBUG else [logging.FileHandler("app.log")])
    ]
)

logger = logging.getLogger(__name__)

# Audit log decorator
def audit_log(action: str):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            logger.info(
                f"AUDIT: {action}",
                extra={
                    "action": action,
                    "user": kwargs.get("current_user", {}).get("sub"),
                    "timestamp": datetime.utcnow().isoformat(),
                }
            )
            return result
        return wrapper
    return decorator

# Apply to sensitive routes
@router.delete("/{project_id}")
@audit_log("delete_project")
async def delete_project(...):
    pass
```

---

## 🟢 Low Priority (Post-Launch)

### 7. CSRF Protection

**Consider for session-based flows:**
```python
# Only needed if using session cookies alongside JWT
from fastapi_csrf_protect import CsrfProtect

@CsrfProtect.load_config
def get_csrf_config():
    return CsrfSettings(secret_key=settings.SECRET_KEY)
```

---

## Implementation Checklist

| Task | Priority | Estimated Time | Status |
|------|----------|----------------|--------|
| Environment-based SECRET_KEY | 🔴 Critical | 1 hour | [ ] |
| Resource-level authorization | 🔴 Critical | 4 hours | [ ] |
| Rate limiting implementation | 🔴 Critical | 2 hours | [ ] |
| Input sanitization | 🟡 Medium | 2 hours | [ ] |
| Security headers | 🟡 Medium | 1 hour | [ ] |
| Logging & audit trail | 🟡 Medium | 2 hours | [ ] |
| CSRF protection | 🟢 Low | 2 hours | [ ] |

**Total Estimated Time: 14 hours**

---

## Testing Security Fixes

After implementing each fix, verify:

1. **Secret Key:** Verify app fails to start without SECRET_KEY env var
2. **Authorization:** Test users cannot access/modify others' resources
3. **Rate Limiting:** Test login rate limit with rapid requests
4. **Headers:** Verify security headers in HTTP responses
5. **Logging:** Confirm audit events are logged

---

*Document Created: March 23, 2026*