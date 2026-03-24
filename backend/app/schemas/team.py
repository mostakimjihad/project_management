"""Team schemas."""
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.team import TeamMemberRole
from app.schemas.common import PaginatedResponse
from app.schemas.user import UserBase


class TeamBase(BaseModel):
    """Base team schema."""
    name: str
    description: Optional[str] = None
class TeamCreate(TeamBase):
    """Team creation schema."""
    pass
class TeamUpdate(BaseModel):
    """Team update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
class TeamInDB(BaseModel):
    """Team in database schema."""
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
class TeamMemberBase(BaseModel):
    """Team member base schema."""
    user_id: uuid.UUID
    role: TeamMemberRole = TeamMemberRole.MEMBER
class TeamMemberCreate(TeamMemberBase):
    """Team member creation schema."""
    pass
class TeamMemberResponse(TeamMemberBase):
    """Team member response schema."""
    id: uuid.UUID
    team_id: uuid.UUID
    user: UserBase
    joined_at: datetime


class TeamResponse(TeamInDB):
    """Team response schema."""
    members: Optional[List[TeamMemberResponse]] = None
    projects: Optional[List[dict]] = None


# Update forward references
TeamResponse.model_rebuild()
