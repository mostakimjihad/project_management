"""Time entry schemas."""
import uuid
from datetime import date, datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel


class TimeEntryBase(BaseModel):
    """Base time entry schema."""
    task_id: uuid.UUID
    user_id: uuid.UUID
    description: Optional[str] = None
    hours: Decimal
    hourly_rate: Decimal
    billable: bool = True
    logged_at: date


class TimeEntryCreate(TimeEntryBase):
    """Time entry creation schema."""
    pass


class TimeEntryUpdate(BaseModel):
    """Time entry update schema."""
    description: Optional[str] = None
    hours: Optional[Decimal] = None
    hourly_rate: Optional[Decimal] = None
    billable: Optional[bool] = None
    logged_at: Optional[date] = None


class TimeEntryInDB(BaseModel):
    """Time entry in database schema."""
    id: uuid.UUID
    task_id: uuid.UUID
    user_id: uuid.UUID
    description: Optional[str] = None
    hours: Decimal
    hourly_rate: Decimal
    billable: bool
    logged_at: date
    created_at: datetime

    class Config:
        from_attributes = True


class TimeEntryResponse(TimeEntryInDB):
    """Time entry response schema."""
    pass