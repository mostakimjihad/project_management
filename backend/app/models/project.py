"""Project and Milestone models."""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Text, DateTime, Date, Integer, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class ProjectStatus(str, enum.Enum):
    """Project status."""
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on-hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ProjectPriority(str, enum.Enum):
    """Project priority."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class MilestoneStatus(str, enum.Enum):
    """Milestone status."""
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"


class Project(Base):
    """Project model."""
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(ProjectStatus), nullable=False, default=ProjectStatus.PLANNING, index=True)
    priority = Column(SQLEnum(ProjectPriority), nullable=False, default=ProjectPriority.MEDIUM)
    budget = Column(Numeric(15, 2), nullable=False, default=0)
    spent = Column(Numeric(15, 2), nullable=False, default=0)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    actual_end_date = Column(Date, nullable=True)
    progress = Column(Integer, nullable=False, default=0)  # 0-100
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    team = relationship("Team", back_populates="projects", lazy="selectin")
    creator = relationship("User", back_populates="created_projects", lazy="selectin")
    tasks = relationship("Task", back_populates="project", lazy="selectin")
    milestones = relationship("Milestone", back_populates="project", lazy="selectin")
    costs = relationship("Cost", back_populates="project", lazy="selectin")
    budgets = relationship("Budget", back_populates="project", lazy="selectin")
    risks = relationship("Risk", back_populates="project", lazy="selectin")

    def __repr__(self):
        return f"<Project {self.name}>"


class Milestone(Base):
    """Milestone model."""
    __tablename__ = "milestones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(Date, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    status = Column(SQLEnum(MilestoneStatus), nullable=False, default=MilestoneStatus.PENDING)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="milestones", lazy="selectin")
    tasks = relationship("Task", back_populates="milestone", lazy="selectin")

    def __repr__(self):
        return f"<Milestone {self.name}>"