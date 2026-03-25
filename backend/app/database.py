"""Database connection and session management."""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData, select

from app.config import settings

# Naming convention for constraints
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=convention)


class Base(DeclarativeBase):
    """Base class for all models."""
    metadata = metadata


# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    """Dependency for getting database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections."""
    await engine.dispose()


async def seed_default_data():
    """Seed default roles, permissions, and admin user."""
    from app.models.role import Role, Permission
    from app.models.user import User, UserRole, ApprovalStatus
    from app.utils.security import hash_password
    
    async with async_session() as session:
        # Check if already seeded
        result = await session.execute(select(Role).limit(1))
        if result.scalar_one_or_none():
            return  # Already seeded
        
        # Define default permissions by module
        permissions_data = [
            # Projects
            ("projects:create", "Create Projects", "Create new projects", "projects", "create"),
            ("projects:read", "View Projects", "View project details", "projects", "read"),
            ("projects:update", "Edit Projects", "Edit project information", "projects", "update"),
            ("projects:delete", "Delete Projects", "Delete projects", "projects", "delete"),
            
            # Tasks
            ("tasks:create", "Create Tasks", "Create new tasks", "tasks", "create"),
            ("tasks:read", "View Tasks", "View task details", "tasks", "read"),
            ("tasks:update", "Edit Tasks", "Edit task information", "tasks", "update"),
            ("tasks:delete", "Delete Tasks", "Delete tasks", "tasks", "delete"),
            ("tasks:assign", "Assign Tasks", "Assign tasks to users", "tasks", "assign"),
            
            # Teams
            ("teams:create", "Create Teams", "Create new teams", "teams", "create"),
            ("teams:read", "View Teams", "View team details", "teams", "read"),
            ("teams:update", "Edit Teams", "Edit team information", "teams", "update"),
            ("teams:delete", "Delete Teams", "Delete teams", "teams", "delete"),
            ("teams:manage_members", "Manage Team Members", "Add/remove team members", "teams", "manage_members"),
            
            # Users
            ("users:read", "View Users", "View user profiles", "users", "read"),
            ("users:update", "Edit Users", "Edit user information", "users", "update"),
            ("users:delete", "Delete Users", "Delete/deactivate users", "users", "delete"),
            ("users:approve", "Approve Users", "Approve pending user registrations", "users", "approve"),
            
            # Roles & Permissions
            ("roles:create", "Create Roles", "Create custom roles", "roles", "create"),
            ("roles:read", "View Roles", "View role details", "roles", "read"),
            ("roles:update", "Edit Roles", "Edit role permissions", "roles", "update"),
            ("roles:delete", "Delete Roles", "Delete custom roles", "roles", "delete"),
            ("roles:assign", "Assign Roles", "Assign roles to users", "roles", "assign"),
            
            # Risks
            ("risks:create", "Create Risks", "Create new risks", "risks", "create"),
            ("risks:read", "View Risks", "View risk details", "risks", "read"),
            ("risks:update", "Edit Risks", "Edit risk information", "risks", "update"),
            ("risks:delete", "Delete Risks", "Delete risks", "risks", "delete"),
            
            # Costs
            ("costs:create", "Create Costs", "Create cost entries", "costs", "create"),
            ("costs:read", "View Costs", "View cost details", "costs", "read"),
            ("costs:update", "Edit Costs", "Edit cost information", "costs", "update"),
            ("costs:delete", "Delete Costs", "Delete cost entries", "costs", "delete"),
            
            # Time Entries
            ("time:create", "Log Time", "Create time entries", "time", "create"),
            ("time:read", "View Time Entries", "View time logs", "time", "read"),
            ("time:update", "Edit Time Entries", "Edit time logs", "time", "update"),
            ("time:delete", "Delete Time Entries", "Delete time entries", "time", "delete"),
            
            # Dashboard & Reports
            ("dashboard:view", "View Dashboard", "Access dashboard", "dashboard", "view"),
            ("reports:view", "View Reports", "Access reports", "reports", "view"),
            ("reports:export", "Export Reports", "Export reports to files", "reports", "export"),
        ]
        
        # Create permissions
        permissions = []
        for name, display_name, description, module, action in permissions_data:
            perm = Permission(
                name=name,
                display_name=display_name,
                description=description,
                module=module,
                action=action,
            )
            permissions.append(perm)
            session.add(perm)
        
        await session.flush()
        
        # Create default roles
        admin_role = Role(
            name="admin",
            display_name="Administrator",
            description="Full system access with all permissions",
            is_system=True,
            permissions=permissions,  # All permissions
        )
        session.add(admin_role)
        
        manager_role = Role(
            name="manager",
            display_name="Project Manager",
            description="Manage projects, tasks, and teams",
            is_system=True,
            permissions=[p for p in permissions if p.module in ["projects", "tasks", "teams", "risks", "costs", "time", "dashboard", "reports"]],
        )
        session.add(manager_role)
        
        member_role = Role(
            name="member",
            display_name="Team Member",
            description="Basic team member access",
            is_system=True,
            permissions=[p for p in permissions if p.action in ["read", "create"] and p.module not in ["roles", "users"]],
        )
        session.add(member_role)
        
        await session.flush()
        
        # Check if admin user exists
        result = await session.execute(select(User).where(User.email == "mostakimjihad@outlook.com"))
        if not result.scalar_one_or_none():
            # Create default admin user
            admin_user = User(
                email="mostakimjihad@outlook.com",
                password_hash=hash_password("Admin@123"),  # Should be changed on first login
                full_name="System Administrator",
                role=UserRole.ADMIN,
                approval_status=ApprovalStatus.APPROVED,
                is_active=True,
            )
            session.add(admin_user)
        
        await session.commit()
