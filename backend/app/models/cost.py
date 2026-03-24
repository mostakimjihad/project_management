"""Cost and Budget models."""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Text, DateTime, Date, Numeric, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class CostCategory(str, enum.Enum):
    """Cost categories."""
    LABOR = "labor"
    SOFTWARE = "software"
    HARDWARE = "hardware"
    INFRASTRUCTURE = "infrastructure"
    OTHER = "other"


class Cost(Base):
    """Cost model for tracking expenses."""
    __tablename__ = "costs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    category = Column(SQLEnum(CostCategory), nullable=False, index=True)
    description = Column(Text, nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    incurred_date = Column(Date, nullable=False, index=True)
    approved = Column(Boolean, nullable=False, default=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="costs", lazy="selectin")
    approver = relationship("User", foreign_keys=[approved_by], lazy="selectin")
    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")

    def __repr__(self):
        return f"<Cost {self.amount} {self.currency}>"


class Budget(Base):
    """Budget model for budget allocations."""
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    category = Column(SQLEnum(CostCategory), nullable=False)
    allocated = Column(Numeric(15, 2), nullable=False)
    spent = Column(Numeric(15, 2), nullable=False, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="budgets", lazy="selectin")

    @property
    def remaining(self):
        """Calculate remaining budget."""
        return self.allocated - self.spent

    @property
    def utilization_percentage(self):
        """Calculate budget utilization percentage."""
        if self.allocated == 0:
            return 0
        return (self.spent / self.allocated) * 100

    def __repr__(self):
        return f"<Budget {self.category}: {self.spent}/{self.allocated}>"