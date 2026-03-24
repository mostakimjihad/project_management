"""Cost routes."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.cost import Cost, Budget, CostCategory
from app.schemas.cost import CostCreate, CostUpdate, CostResponse, BudgetCreate, BudgetResponse, CostAnalysis
from app.schemas.common import PaginatedResponse
from app.dependencies import get_current_active_user


router = APIRouter(tags=["Costs"])


@router.get("", response_model=PaginatedResponse[CostResponse])
async def list_costs(
    page: int = 1,
    limit: int = 10,
    project_id: Optional[str] = None,
    category: Optional[CostCategory] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """List costs with pagination."""
    query = select(Cost)
    
    if project_id:
        query = query.where(Cost.project_id == project_id)
    if category:
        query = query.where(Cost.category == category)
    
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    costs = result.scalars().all()
    
    return PaginatedResponse.create(
        items=costs,
        total=len(costs),
        page=page,
        limit=limit,
    )


@router.post("", response_model=CostResponse, status_code=201)
async def create_cost(
    cost_data: CostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Create a new cost entry."""
    cost = Cost(
        **cost_data.model_dump(),
        created_by=current_user["sub"],
    )
    db.add(cost)
    await db.commit()
    await db.refresh(cost)
    
    return CostResponse.model_validate(cost)


@router.get("/analysis/{project_id}", response_model=CostAnalysis)
async def get_cost_analysis(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Get cost analysis for a project."""
    # Get total spent
    total_result = await db.execute(
        select(func.sum(Cost.amount)).where(Cost.project_id == project_id)
    )
    total_spent = float(total_result.scalar() or 0)
    
    # Get costs by category
    category_result = await db.execute(
        select(Cost.category, func.sum(Cost.amount))
        .where(Cost.project_id == project_id)
        .group_by(Cost.category)
    )
    by_category = [
        {"category": row[0].value, "amount": float(row[1])}
        for row in category_result.all()
    ]
    
    return CostAnalysis(
        project_id=project_id,
        budget=0,  # Would fetch from project
        total_spent=total_spent,
        remaining_budget=0,
        budget_utilization=0,
        by_category=by_category,
        monthly_trend=[],
    )


@router.post("/budgets", response_model=BudgetResponse, status_code=201)
async def create_budget(
    budget_data: BudgetCreate,
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Create a budget allocation."""
    budget = Budget(
        project_id=project_id,
        **budget_data.model_dump(),
    )
    db.add(budget)
    await db.commit()
    await db.refresh(budget)
    
    return BudgetResponse.model_validate(budget)