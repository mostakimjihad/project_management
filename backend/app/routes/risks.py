"""Risk routes."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.risk import Risk, RiskCategory, RiskStatus, calculate_risk_score
from app.schemas.risk import RiskCreate, RiskUpdate, RiskResponse, RiskAnalysis
from app.schemas.common import PaginatedResponse
from app.dependencies import get_current_active_user


router = APIRouter(tags=["Risks"])


@router.get("", response_model=PaginatedResponse[RiskResponse])
async def list_risks(
    page: int = 1,
    limit: int = 10,
    project_id: Optional[str] = None,
    category: Optional[RiskCategory] = None,
    status: Optional[RiskStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """List risks with pagination."""
    query = select(Risk)
    
    if project_id:
        query = query.where(Risk.project_id == project_id)
    if category:
        query = query.where(Risk.category == category)
    if status:
        query = query.where(Risk.status == status)
    
    query = query.order_by(Risk.risk_score.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    risks = result.scalars().all()
    
    return PaginatedResponse.create(
        items=risks,
        total=len(risks),
        page=page,
        limit=limit,
    )


@router.post("", response_model=RiskResponse, status_code=201)
async def create_risk(
    risk_data: RiskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Create a new risk."""
    risk_score = calculate_risk_score(risk_data.probability, risk_data.impact)
    
    risk = Risk(
        **risk_data.model_dump(),
        risk_score=risk_score,
        created_by=current_user["sub"],
    )
    db.add(risk)
    await db.commit()
    await db.refresh(risk)
    
    return RiskResponse.model_validate(risk)


@router.get("/{risk_id}", response_model=RiskResponse)
async def get_risk(
    risk_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Get risk by ID."""
    result = await db.execute(
        select(Risk).where(Risk.id == risk_id)
    )
    risk = result.scalar_one_or_none()
    
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    
    return RiskResponse.model_validate(risk)


@router.put("/{risk_id}", response_model=RiskResponse)
async def update_risk(
    risk_id: str,
    risk_data: RiskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Update risk."""
    result = await db.execute(
        select(Risk).where(Risk.id == risk_id)
    )
    risk = result.scalar_one_or_none()
    
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    
    update_data = risk_data.model_dump(exclude_unset=True)
    
    # Recalculate risk score if probability or impact changed
    if "probability" in update_data or "impact" in update_data:
        prob = update_data.get("probability", risk.probability)
        imp = update_data.get("impact", risk.impact)
        update_data["risk_score"] = calculate_risk_score(prob, imp)
    
    for field, value in update_data.items():
        setattr(risk, field, value)
    
    await db.commit()
    await db.refresh(risk)
    
    return RiskResponse.model_validate(risk)


@router.get("/analysis/{project_id}", response_model=RiskAnalysis)
async def get_risk_analysis(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Get risk analysis for a project."""
    # Get all risks for project
    result = await db.execute(
        select(Risk).where(Risk.project_id == project_id)
    )
    risks = result.scalars().all()
    
    # Calculate summary
    total_risks = len(risks)
    high_risks = len([r for r in risks if r.risk_score >= 6])
    critical_risks = len([r for r in risks if r.risk_score >= 12])
    
    # Risk matrix
    matrix = {}
    for risk in risks:
        key = f"{risk.probability.value}_{risk.impact.value}"
        matrix[key] = matrix.get(key, 0) + 1
    
    # Top risks
    top_risks = sorted(risks, key=lambda r: r.risk_score, reverse=True)[:5]
    
    return RiskAnalysis(
        project_id=project_id,
        summary={
            "total": total_risks,
            "high": high_risks,
            "critical": critical_risks,
        },
        risk_matrix=matrix,
        top_risks=[
            {
                "id": str(r.id),
                "title": r.title,
                "score": r.risk_score,
                "severity": r.severity,
            }
            for r in top_risks
        ],
        recommendations=[
            "Review high-priority risks immediately",
            "Develop mitigation plans for risks with score >= 6",
            "Monitor budget-related risks closely",
        ],
    )