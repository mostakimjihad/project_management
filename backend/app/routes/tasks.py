"""Task routes."""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.task import Task, TaskStatus, TaskPriority
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.schemas.common import PaginatedResponse
from app.dependencies import get_current_active_user, verify_task_access
from app.utils.sanitize import sanitize_input


router = APIRouter(tags=["Tasks"])


@router.get("", response_model=PaginatedResponse[TaskResponse])
async def list_tasks(
    page: int = 1,
    limit: int = 10,
    project_id: Optional[str] = None,
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    assignee_id: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """List tasks with pagination."""
    # Build base query for filtering
    query = select(Task)
    count_query = select(func.count(Task.id))
    
    if project_id:
        query = query.where(Task.project_id == project_id)
        count_query = count_query.where(Task.project_id == project_id)
    if status:
        query = query.where(Task.status == status)
        count_query = count_query.where(Task.status == status)
    if priority:
        query = query.where(Task.priority == priority)
        count_query = count_query.where(Task.priority == priority)
    if assignee_id:
        query = query.where(Task.assigned_to == assignee_id)
        count_query = count_query.where(Task.assigned_to == assignee_id)
    if search:
        # Sanitize search input
        search = sanitize_input(search)
        search_pattern = f"%{search}%"
        query = query.where(Task.title.ilike(search_pattern))
        count_query = count_query.where(Task.title.ilike(search_pattern))
    
    # Get total count
    total = await db.scalar(count_query) or 0
    
    # Apply pagination
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    return PaginatedResponse.create(
        items=[TaskResponse.model_validate(t) for t in tasks],
        total=total,
        page=page,
        limit=limit,
    )


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(
    task_data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Create a new task."""
    # Sanitize input fields
    title = sanitize_input(task_data.title)
    description = sanitize_input(task_data.description)
    
    task = Task(
        title=title,
        description=description,
        status=task_data.status,
        priority=task_data.priority,
        estimated_hours=task_data.estimated_hours,
        due_date=task_data.due_date,
        project_id=task_data.project_id,
        milestone_id=task_data.milestone_id,
        assigned_to=task_data.assigned_to,
        created_by=uuid.UUID(current_user["sub"]),
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    
    return TaskResponse.model_validate(task)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Get task by ID."""
    # Verify access (raises 404 if not found, 403 if no access)
    task = await verify_task_access(task_id, current_user, db, require_edit=False)
    
    return TaskResponse.model_validate(task)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Update task - requires edit permission."""
    # Verify edit access
    task = await verify_task_access(task_id, current_user, db, require_edit=True)
    
    update_data = task_data.model_dump(exclude_unset=True)
    
    # Sanitize text fields
    if "title" in update_data:
        update_data["title"] = sanitize_input(update_data["title"])
    if "description" in update_data:
        update_data["description"] = sanitize_input(update_data["description"])
    
    for field, value in update_data.items():
        setattr(task, field, value)
    
    await db.commit()
    await db.refresh(task)
    
    return TaskResponse.model_validate(task)


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Delete task - requires edit permission."""
    # Verify edit access (only creator, assignee, or admin can delete)
    task = await verify_task_access(task_id, current_user, db, require_edit=True)
    
    await db.delete(task)
    await db.commit()