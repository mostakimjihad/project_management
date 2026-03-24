"""TimeEntry model."""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Text, DateTime, Date, Numeric, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class TimeEntry(Base):
    """Time entry model for tracking work hours."""
    __tablename__ = "time_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    description = Column(Text, nullable=True)
    hours = Column(Numeric(6, 2), nullable=False)
    hourly_rate = Column(Numeric(10, 2), nullable=False)
    billable = Column(Boolean, nullable=False, default=True)
    logged_at = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    task = relationship("Task", back_populates="time_entries", lazy="selectin")
    user = relationship("User", back_populates="time_entries", lazy="selectin")

    def __repr__(self):
        return f"<TimeEntry {self.hours}h by {self.user_id}>"