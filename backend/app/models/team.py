"""Team and TeamMember models."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class TeamMemberRole(str, enum.Enum):
    """Team member roles."""
    LEAD = "lead"
    MEMBER = "member"


class Team(Base):
    """Team model."""
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="created_teams", lazy="selectin")
    members = relationship("TeamMember", back_populates="team", lazy="selectin")
    projects = relationship("Project", back_populates="team", lazy="selectin")

    def __repr__(self):
        return f"<Team {self.name}>"


class TeamMember(Base):
    """Team member junction table."""
    __tablename__ = "team_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    role = Column(SQLEnum(TeamMemberRole), nullable=False, default=TeamMemberRole.MEMBER)
    joined_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    team = relationship("Team", back_populates="members", lazy="selectin")
    user = relationship("User", back_populates="team_memberships", lazy="selectin")

    def __repr__(self):
        return f"<TeamMember {self.user_id} in {self.team_id}>"