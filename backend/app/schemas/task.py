"""Task schemas."""
import uuid
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.task import TaskStatus, TaskPriority


class TaskBase(BaseModel):
    """Base task schema."""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    estimated_hours: Optional[float] = Field(None, ge=0)
    due_date: Optional[date] = None
    project_id: uuid.UUID
    milestone_id: Optional[uuid.UUID] = None
    parent_id: Optional[uuid.UUID] = None
    assigned_to: Optional[uuid.UUID] = None


class TaskCreate(BaseModel):
    """Task creation schema."""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    estimated_hours: Optional[float] = Field(None, ge=0)
    due_date: Optional[date] = None
    project_id: uuid.UUID
    milestone_id: Optional[uuid.UUID] = None
    assigned_to: Optional[uuid.UUID] = None


class TaskUpdate(BaseModel):
    """Task update schema."""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    estimated_hours: Optional[float] = Field(None, ge=0)
    actual_hours: Optional[float] = Field(None, ge=0)
    due_date: Optional[date] = None
    milestone_id: Optional[uuid.UUID] = None
    assigned_to: Optional[uuid.UUID] = None


class TaskInDB(BaseModel):
    """Task in database schema."""
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    due_date: Optional[date] = None
    project_id: uuid.UUID
    milestone_id: Optional[uuid.UUID] = None
    parent_id: Optional[uuid.UUID] = None
    assigned_to: Optional[uuid.UUID] = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskResponse(TaskInDB):
    """Task response schema."""
    pass


class TaskCommentBase(BaseModel):
    """Task comment base schema."""
    content: str = Field(..., min_length=1)


class TaskCommentCreate(TaskCommentBase):
    """Task comment creation schema."""
    pass


class TaskCommentResponse(TaskCommentBase):
    """Task comment response schema."""
    id: uuid.UUID
    user_id: uuid.UUID
    task_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True