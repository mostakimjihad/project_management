"""Dashboard routes."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.project import Project, ProjectStatus
from app.models.task import Task, TaskStatus as TaskStatusEnum
from app.models.risk import Risk
from app.models.cost import Cost
from app.dependencies import get_current_active_user


router = APIRouter(tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Get dashboard statistics."""
    # Project stats
    total_projects = await db.scalar(select(func.count(Project.id))) or 0
    active_projects = await db.scalar(
        select(func.count(Project.id)).where(Project.status == ProjectStatus.ACTIVE)
    ) or 0
    
    # Task stats
    total_tasks = await db.scalar(select(func.count(Task.id))) or 0
    completed_tasks = await db.scalar(
        select(func.count(Task.id)).where(Task.status == TaskStatusEnum.DONE)
    ) or 0
    overdue_tasks = await db.scalar(
        select(func.count(Task.id)).where(
            Task.due_date < datetime.utcnow(),
            Task.status != TaskStatusEnum.DONE,
        )
    ) or 0
    
    # Risk stats
    total_risks = await db.scalar(select(func.count(Risk.id))) or 0
    high_risks = await db.scalar(
        select(func.count(Risk.id)).where(Risk.risk_score >= 6)
    ) or 0
    
    # Cost stats
    total_spent = await db.scalar(select(func.sum(Cost.amount))) or 0
    
    return {
        "projects": {
            "total": total_projects,
            "active": active_projects,
        },
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "overdue": overdue_tasks,
        },
        "risks": {
            "total": total_risks,
            "high": high_risks,
        },
        "costs": {
            "total_spent": float(total_spent),
        },
    }


@router.get("/overview")
async def get_dashboard_overview(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Get dashboard overview statistics."""
    # Project stats
    total_projects = await db.scalar(select(func.count(Project.id)))
    active_projects = await db.scalar(
        select(func.count(Project.id)).where(Project.status == ProjectStatus.ACTIVE)
    )
    
    # Task stats
    total_tasks = await db.scalar(select(func.count(Task.id)))
    completed_tasks = await db.scalar(
        select(func.count(Task.id)).where(Task.status == TaskStatusEnum.DONE)
    )
    overdue_tasks = await db.scalar(
        select(func.count(Task.id)).where(
            Task.due_date < datetime.utcnow(),
            Task.status != TaskStatusEnum.DONE,
        )
    )
    
    # Risk stats
    total_risks = await db.scalar(select(func.count(Risk.id)))
    high_risks = await db.scalar(
        select(func.count(Risk.id)).where(Risk.risk_score >= 6)
    )
    
    # Cost stats
    total_spent = await db.scalar(select(func.sum(Cost.amount))) or 0
    
    return {
        "projects": {
            "total": total_projects,
            "active": active_projects,
        },
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "overdue": overdue_tasks,
        },
        "risks": {
            "total": total_risks,
            "high": high_risks,
        },
        "costs": {
            "total_spent": float(total_spent),
        },
    }


@router.get("/upcoming-deadlines")
async def get_upcoming_deadlines(
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Get upcoming deadlines."""
    now = datetime.utcnow()
    future = now + timedelta(days=days)
    
    # Tasks due soon
    tasks_result = await db.execute(
        select(Task)
        .where(Task.due_date.between(now, future))
        .where(Task.status != TaskStatusEnum.DONE)
        .order_by(Task.due_date)
    )
    tasks = tasks_result.scalars().all()
    
    # Projects due soon
    projects_result = await db.execute(
        select(Project)
        .where(Project.end_date.between(now, future))
        .where(Project.status != ProjectStatus.COMPLETED)
        .order_by(Project.end_date)
    )
    projects = projects_result.scalars().all()
    
    return {
        "tasks": [
            {
                "id": str(t.id),
                "title": t.title,
                "due_date": t.due_date.isoformat() if t.due_date else None,
            }
            for t in tasks
        ],
        "projects": [
            {
                "id": str(p.id),
                "name": p.name,
                "end_date": p.end_date.isoformat() if p.end_date else None,
            }
            for p in projects
        ],
    }