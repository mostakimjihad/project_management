"""API routes."""
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.projects import router as projects_router
from app.routes.tasks import router as tasks_router
from app.routes.teams import router as teams_router
from app.routes.costs import router as costs_router
from app.routes.risks import router as risks_router
from app.routes.dashboard import router as dashboard_router

__all__ = [
    "auth_router",
    "users_router",
    "projects_router",
    "tasks_router",
    "teams_router",
    "costs_router",
    "risks_router",
    "dashboard_router",
]