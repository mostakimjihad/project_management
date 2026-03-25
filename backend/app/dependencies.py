"""Dependency injection for FastAPI."""
import uuid
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
from app.models.task import Task
from app.models.team import Team, TeamMember


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
) -> dict:
    """Get current active user and verify they exist."""
    if not payload:
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
    # Convert string to UUID for database query
    try:
        user_uuid = uuid.UUID(current_user["sub"])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_uuid)
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
    # Convert string to UUID
    try:
        project_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    result = await db.execute(
        select(Project).where(Project.id == project_uuid)
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
                    TeamMember.role == "lead"
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


async def verify_task_access(
    task_id: str,
    user: dict,
    db: AsyncSession,
    require_edit: bool = False,
) -> Task:
    """Verify user has access to the task.
    
    Args:
        task_id: UUID of the task
        user: Current user dict with 'sub' and 'role'
        db: Database session
        require_edit: If True, requires edit permission
    
    Returns:
        Task entity
        
    Raises:
        HTTPException: 404 if not found, 403 if no access
    """
    # Convert string to UUID
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    
    result = await db.execute(
        select(Task).where(Task.id == task_uuid)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Admins have full access
    if user["role"] == UserRole.ADMIN.value:
        return task
    
    # Creator has full access
    if str(task.created_by) == user["sub"]:
        return task
    
    # Assignee has edit access
    if task.assignee_id and str(task.assignee_id) == user["sub"]:
        return task
    
    if require_edit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this task"
        )
    
    # Check project access for read
    if task.project_id:
        try:
            await verify_project_access(str(task.project_id), user, db, require_edit=False)
            return task
        except HTTPException:
            pass
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You don't have access to this task"
    )


async def verify_team_access(
    team_id: str,
    user: dict,
    db: AsyncSession,
    require_edit: bool = False,
) -> Team:
    """Verify user has access to the team.
    
    Args:
        team_id: UUID of the team
        user: Current user dict with 'sub' and 'role'
        db: Database session
        require_edit: If True, requires edit permission (team lead or admin)
    
    Returns:
        Team entity
        
    Raises:
        HTTPException: 404 if not found, 403 if no access
    """
    # Convert string to UUID
    try:
        team_uuid = uuid.UUID(team_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid team ID format")
    
    result = await db.execute(
        select(Team).where(Team.id == team_uuid)
    )
    team = result.scalar_one_or_none()
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Admins have full access
    if user["role"] == UserRole.ADMIN.value:
        return team
    
    # Creator has full access
    if str(team.created_by) == user["sub"]:
        return team
    
    # Check team membership
    member_result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user["sub"]
        )
    )
    membership = member_result.scalar_one_or_none()
    
    if require_edit:
        if membership and membership.role == "lead":
            return team
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this team"
        )
    
    if membership:
        return team
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You don't have access to this team"
    )