"""Risk schemas."""
import uuid
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel
from app.models.risk import RiskCategory, RiskProbability, RiskImpact, RiskStatus
from app.schemas.common import PaginatedResponse
class RiskBase(BaseModel):
    """Base risk schema."""
    title: str
    description: str
    category: RiskCategory
    probability: RiskProbability
    impact: RiskImpact
    status: RiskStatus = RiskStatus.IDENTIFIED
    mitigation_plan: Optional[str] = None
    owner_id: Optional[uuid.UUID] = None
    identified_date: date
    target_resolution_date: Optional[date] = None
    project_id: uuid.UUID
class RiskCreate(RiskBase):
    """Risk creation schema."""
    pass
class RiskUpdate(BaseModel):
    """Risk update schema."""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[RiskCategory] = None
    probability: Optional[RiskProbability] = None
    impact: Optional[RiskImpact] = None
    status: Optional[RiskStatus] = None
    mitigation_plan: Optional[str] = None
    owner_id: Optional[uuid.UUID] = None
    target_resolution_date: Optional[date] = None
class RiskInDB(BaseModel):
    """Risk in database schema."""
    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    description: str
    category: RiskCategory
    probability: RiskProbability
    impact: RiskImpact
    risk_score: int
    status: RiskStatus
    mitigation_plan: Optional[str] = None
    owner_id: Optional[uuid.UUID] = None
    identified_date: date
    target_resolution_date: Optional[date] = None
    resolved_date: Optional[date] = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
class RiskResponse(RiskInDB):
    """Risk response schema."""
    project: Optional[dict] = None
    owner: Optional[dict] = None
class RiskAnalysis(BaseModel):
    """Risk analysis response."""
    project_id: uuid.UUID
    summary: dict
    risk_matrix: dict
    top_risks: List[dict]
    recommendations: List[str]
