"""Cost and Budget schemas."""
import uuid
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel
from app.models.cost import CostCategory
from app.schemas.common import PaginatedResponse


class CostBase(BaseModel):
    """Base cost schema."""
    category: CostCategory
    description: str
    amount: float
    currency: str = "USD"
    incurred_date: date
    project_id: uuid.UUID
class CostCreate(CostBase):
    """Cost creation schema."""
    pass
class CostUpdate(BaseModel):
    """Cost update schema."""
    category: Optional[CostCategory] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    incurred_date: Optional[date] = None
class CostInDB(BaseModel):
    """Cost in database schema."""
    id: uuid.UUID
    project_id: uuid.UUID
    category: CostCategory
    description: str
    amount: float
    currency: str
    incurred_date: date
    approved: bool
    approved_by: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
class CostResponse(CostInDB):
    """Cost response schema."""
    project: Optional[dict] = None
    approved_by_user: Optional[dict] = None
class BudgetBase(BaseModel):
    """Base budget schema."""
    category: CostCategory
    allocated: float
    notes: Optional[str] = None
class BudgetCreate(BudgetBase):
    """Budget creation schema."""
    pass
class BudgetResponse(BudgetBase):
    """Budget response schema."""
    id: uuid.UUID
    project_id: uuid.UUID
    spent: float
    remaining: float
    utilization_percentage: float
class CostAnalysis(BaseModel):
    """Cost analysis response."""
    project_id: uuid.UUID
    budget: float
    total_spent: float
    remaining_budget: float
    budget_utilization: float
    by_category: List[dict]
    monthly_trend: List[dict]
    projected_total: Optional[float] = None
    projected_overrun: Optional[float] = None
