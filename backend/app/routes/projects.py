"""Project routes."""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.project import Project, ProjectStatus, ProjectPriority
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.schemas.common import PaginatedResponse
from app.dependencies import get_current_active_user, verify_project_access
from app.utils.sanitize import sanitize_input

router = APIRouter(tags=["Projects"])


@router.get("", response_model=PaginatedResponse[ProjectResponse])
async def list_projects(
    page: int = 1,
    limit: int = 10,
    status: Optional[ProjectStatus] = None,
    priority: Optional[ProjectPriority] = None,
    team_id: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """List projects with pagination."""
    # Build base query for filtering
    query = select(Project)
    count_query = select(func.count(Project.id))
    
    if status:
        query = query.where(Project.status == status)
        count_query = count_query.where(Project.status == status)
    if priority:
        query = query.where(Project.priority == priority)
        count_query = count_query.where(Project.priority == priority)
    if team_id:
        query = query.where(Project.team_id == team_id)
        count_query = count_query.where(Project.team_id == team_id)
    if search:
        # Sanitize search input
        search = sanitize_input(search)
        search_pattern = f"%{search}%"
        query = query.where(Project.name.ilike(search_pattern))
        count_query = count_query.where(Project.name.ilike(search_pattern))
    
    # Get total count
    total = await db.scalar(count_query) or 0
    
    # Apply pagination
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    projects = result.scalars().all()
    
    return PaginatedResponse.create(
        items=[ProjectResponse.model_validate(p) for p in projects],
        total=total,
        page=page,
        limit=limit,
    )


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Create a new project."""
    # Sanitize input fields
    name = sanitize_input(project_data.name)
    description = sanitize_input(project_data.description)
    
    project = Project(
        name=name,
        description=description,
        status=project_data.status,
        priority=project_data.priority,
        budget=project_data.budget,
        start_date=project_data.start_date,
        end_date=project_data.end_date,
        team_id=project_data.team_id,
        created_by=uuid.UUID(current_user["sub"]),
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    return ProjectResponse.model_validate(project)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Get project by ID."""
    # Verify access (raises 404 if not found, 403 if no access)
    project = await verify_project_access(project_id, current_user, db, require_edit=False)
    
    return ProjectResponse.model_validate(project)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Update project - requires edit permission."""
    # Verify edit access
    project = await verify_project_access(project_id, current_user, db, require_edit=True)
    
    update_data = project_data.model_dump(exclude_unset=True)
    
    # Sanitize text fields
    if "name" in update_data:
        update_data["name"] = sanitize_input(update_data["name"])
    if "description" in update_data:
        update_data["description"] = sanitize_input(update_data["description"])
    
    for field, value in update_data.items():
        setattr(project, field, value)
    
    await db.commit()
    await db.refresh(project)
    
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Delete project - requires edit permission."""
    # Verify edit access (only creator, team lead, or admin can delete)
    project = await verify_project_access(project_id, current_user, db, require_edit=True)
    
    await db.delete(project)
    await db.commit()