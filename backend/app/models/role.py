"""Role and Permission models for RBAC."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


# Many-to-Many relationship table for Role-Permission
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', UUID(as_uuid=True), ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_id', UUID(as_uuid=True), ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True)
)

# Many-to-Many relationship table for User-Role (custom roles)
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('role_id', UUID(as_uuid=True), ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True)
)


class Permission(Base):
    """Permission model for granular access control."""
    __tablename__ = "permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)  # e.g., 'projects:create'
    display_name = Column(String(255), nullable=False)  # e.g., 'Create Projects'
    description = Column(Text, nullable=True)
    module = Column(String(50), nullable=False, index=True)  # e.g., 'projects', 'tasks', 'users'
    action = Column(String(50), nullable=False)  # e.g., 'create', 'read', 'update', 'delete'
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

    def __repr__(self):
        return f"<Permission {self.name}>"


class Role(Base):
    """Role model for grouping permissions."""
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)  # e.g., 'admin', 'project_manager'
    display_name = Column(String(255), nullable=False)  # e.g., 'Administrator', 'Project Manager'
    description = Column(Text, nullable=True)
    is_system = Column(Boolean, nullable=False, default=False)  # System roles cannot be deleted
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
    users = relationship("User", secondary=user_roles, back_populates="custom_roles")

    def __repr__(self):
        return f"<Role {self.name}>"