"""Task and TaskComment models."""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Text, DateTime, Date, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class TaskStatus(str, enum.Enum):
    """Task status."""
    TODO = "todo"
    IN_PROGRESS = "in-progress"
    REVIEW = "review"
    DONE = "done"
    CANCELLED = "cancelled"


class TaskPriority(str, enum.Enum):
    """Task priority."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Task(Base):
    """Task model."""
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    milestone_id = Column(UUID(as_uuid=True), ForeignKey("milestones.id"), nullable=True, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=True)  # For sub-tasks
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(TaskStatus), nullable=False, default=TaskStatus.TODO, index=True)
    priority = Column(SQLEnum(TaskPriority), nullable=False, default=TaskPriority.MEDIUM)
    estimated_hours = Column(Numeric(6, 2), nullable=True)
    actual_hours = Column(Numeric(6, 2), nullable=True)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    due_date = Column(Date, nullable=True, index=True)
    completed_at = Column(DateTime, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="tasks", lazy="selectin")
    milestone = relationship("Milestone", back_populates="tasks", lazy="selectin")
    parent = relationship("Task", remote_side=[id], lazy="selectin")
    sub_tasks = relationship("Task", back_populates="parent", lazy="selectin")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_tasks", lazy="selectin")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_tasks", lazy="selectin")
    comments = relationship("TaskComment", back_populates="task", lazy="selectin")
    time_entries = relationship("TimeEntry", back_populates="task", lazy="selectin")

    def __repr__(self):
        return f"<Task {self.title}>"


class TaskComment(Base):
    """Task comment model."""
    __tablename__ = "task_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    task = relationship("Task", back_populates="comments", lazy="selectin")
    user = relationship("User", lazy="selectin")

    def __repr__(self):
        return f"<TaskComment {self.id}>"