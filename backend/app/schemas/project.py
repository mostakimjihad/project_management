"""Project schemas."""
import uuid
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.project import ProjectStatus, ProjectPriority


class ProjectBase(BaseModel):
    """Base project schema."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.PLANNING
    priority: ProjectPriority = ProjectPriority.MEDIUM
    budget: float = Field(default=0, ge=0)
    start_date: date
    end_date: Optional[date] = None
    team_id: Optional[uuid.UUID] = None


class ProjectCreate(BaseModel):
    """Project creation schema."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.PLANNING
    priority: ProjectPriority = ProjectPriority.MEDIUM
    budget: float = Field(default=0, ge=0)
    start_date: date
    end_date: Optional[date] = None
    team_id: Optional[uuid.UUID] = None


class ProjectUpdate(BaseModel):
    """Project update schema."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    priority: Optional[ProjectPriority] = None
    budget: Optional[float] = Field(None, ge=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    team_id: Optional[uuid.UUID] = None


class ProjectInDB(BaseModel):
    """Project in database schema."""
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    status: ProjectStatus
    priority: ProjectPriority
    budget: float
    spent: float
    start_date: date
    end_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    progress: int
    team_id: Optional[uuid.UUID] = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectResponse(ProjectInDB):
    """Project response schema."""
    pass


class ProjectStats(BaseModel):
    """Project statistics."""
    total_tasks: int
    completed_tasks: int
    total_risks: int
    high_risks: int
    budget_utilization: float


class ProjectHealth(BaseModel):
    """Project health assessment."""
    overall_health: str
    scores: dict
    metrics: dict
    alerts: List[dict]