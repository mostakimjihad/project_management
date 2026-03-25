"""User model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    """User roles."""
    ADMIN = "admin"
    MANAGER = "manager"
    MEMBER = "member"


class ApprovalStatus(str, enum.Enum):
    """User approval status."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class User(Base):
    """User model."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.MEMBER, index=True)
    hourly_rate = Column(Numeric(10, 2), nullable=True)
    
    # Approval workflow fields
    approval_status = Column(
        SQLEnum(ApprovalStatus), 
        nullable=False, 
        default=ApprovalStatus.PENDING, 
        index=True
    )
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Profile fields
    job_title = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships with explicit foreign_keys to avoid ambiguity
    team_memberships = relationship("TeamMember", back_populates="user", lazy="selectin")
    custom_roles = relationship("Role", secondary="user_roles", back_populates="users", lazy="selectin")
    
    # Self-referential relationship for approver
    approver = relationship("User", remote_side=[id], foreign_keys=[approved_by], lazy="selectin")
    
    assigned_tasks = relationship(
        "Task", 
        foreign_keys="Task.assigned_to",
        back_populates="assignee", 
        lazy="selectin"
    )
    created_tasks = relationship(
        "Task", 
        foreign_keys="Task.created_by",
        back_populates="creator", 
        lazy="selectin"
    )
    time_entries = relationship("TimeEntry", back_populates="user", lazy="selectin")
    created_projects = relationship("Project", back_populates="creator", lazy="selectin")
    created_risks = relationship(
        "Risk", 
        foreign_keys="Risk.created_by",
        back_populates="creator", 
        lazy="selectin"
    )
    owned_risks = relationship(
        "Risk", 
        foreign_keys="Risk.owner_id",
        back_populates="owner", 
        lazy="selectin"
    )
    notifications = relationship("Notification", back_populates="user", lazy="selectin")
    activity_logs = relationship("ActivityLog", back_populates="user", lazy="selectin")
    created_teams = relationship("Team", back_populates="creator", lazy="selectin")

    def __repr__(self):
        return f"<User {self.email}>"