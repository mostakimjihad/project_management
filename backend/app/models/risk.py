"""Risk model."""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Text, DateTime, Date, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class RiskCategory(str, enum.Enum):
    """Risk categories."""
    TECHNICAL = "technical"
    RESOURCE = "resource"
    SCHEDULE = "schedule"
    BUDGET = "budget"
    EXTERNAL = "external"


class RiskProbability(str, enum.Enum):
    """Risk probability levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class RiskImpact(str, enum.Enum):
    """Risk impact levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskStatus(str, enum.Enum):
    """Risk status."""
    IDENTIFIED = "identified"
    ANALYZING = "analyzing"
    MITIGATING = "mitigating"
    RESOLVED = "resolved"
    ACCEPTED = "accepted"


# Risk score calculation matrix
PROBABILITY_VALUES = {
    RiskProbability.LOW: 1,
    RiskProbability.MEDIUM: 2,
    RiskProbability.HIGH: 3,
    RiskProbability.VERY_HIGH: 4,
}

IMPACT_VALUES = {
    RiskImpact.LOW: 1,
    RiskImpact.MEDIUM: 2,
    RiskImpact.HIGH: 3,
    RiskImpact.CRITICAL: 4,
}


def calculate_risk_score(probability: RiskProbability, impact: RiskImpact) -> int:
    """Calculate risk score based on probability and impact."""
    return PROBABILITY_VALUES.get(probability, 1) * IMPACT_VALUES.get(impact, 1)


class Risk(Base):
    """Risk model for risk assessment."""
    __tablename__ = "risks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(SQLEnum(RiskCategory), nullable=False)
    probability = Column(SQLEnum(RiskProbability), nullable=False)
    impact = Column(SQLEnum(RiskImpact), nullable=False)
    risk_score = Column(Integer, nullable=False, index=True)
    status = Column(SQLEnum(RiskStatus), nullable=False, default=RiskStatus.IDENTIFIED, index=True)
    mitigation_plan = Column(Text, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    identified_date = Column(Date, nullable=False)
    target_resolution_date = Column(Date, nullable=True)
    resolved_date = Column(Date, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="risks", lazy="selectin")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_risks", lazy="selectin")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_risks", lazy="selectin")

    @property
    def severity(self) -> str:
        """Get risk severity based on score."""
        if self.risk_score >= 12:
            return "critical"
        elif self.risk_score >= 6:
            return "high"
        elif self.risk_score >= 3:
            return "medium"
        return "low"

    def __repr__(self):
        return f"<Risk {self.title} (Score: {self.risk_score})>"