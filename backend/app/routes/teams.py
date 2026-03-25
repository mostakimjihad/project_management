"""Team routes."""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.team import Team, TeamMember
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamMemberCreate
from app.schemas.common import PaginatedResponse
from app.dependencies import get_current_active_user


router = APIRouter(tags=["Teams"])


@router.get("", response_model=PaginatedResponse[TeamResponse])
async def list_teams(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """List teams with pagination."""
    query = select(Team)
    count_query = select(func.count(Team.id))
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(Team.name.ilike(search_pattern))
        count_query = count_query.where(Team.name.ilike(search_pattern))
    
    total = await db.scalar(count_query) or 0
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    teams = result.scalars().all()
    
    return PaginatedResponse.create(
        items=[TeamResponse.model_validate(t) for t in teams],
        total=total,
        page=page,
        limit=limit,
    )


@router.post("", response_model=TeamResponse, status_code=201)
async def create_team(
    team_data: TeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Create a new team."""
    team = Team(
        name=team_data.name,
        description=team_data.description,
        created_by=uuid.UUID(current_user["sub"]),
    )
    db.add(team)
    await db.commit()
    await db.refresh(team)
    
    return TeamResponse.model_validate(team)


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Get team by ID."""
    result = await db.execute(
        select(Team).where(Team.id == team_id)
    )
    team = result.scalar_one_or_none()
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    return TeamResponse.model_validate(team)


@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: str,
    team_data: TeamUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Update team."""
    result = await db.execute(
        select(Team).where(Team.id == team_id)
    )
    team = result.scalar_one_or_none()
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    for field, value in team_data.model_dump(exclude_unset=True).items():
        setattr(team, field, value)
    
    await db.commit()
    await db.refresh(team)
    
    return TeamResponse.model_validate(team)


@router.delete("/{team_id}", status_code=204)
async def delete_team(
    team_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Delete team."""
    result = await db.execute(
        select(Team).where(Team.id == team_id)
    )
    team = result.scalar_one_or_none()
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    await db.delete(team)
    await db.commit()


@router.get("/{team_id}/members", response_model=list)
async def get_team_members(
    team_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Get all members of a team."""
    try:
        team_uuid = uuid.UUID(team_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid team ID format")
    
    result = await db.execute(
        select(TeamMember).where(TeamMember.team_id == team_uuid)
    )
    members = result.scalars().all()
    
    # Return serializable format
    return [
        {
            "id": str(m.id),
            "team_id": str(m.team_id),
            "user_id": str(m.user_id),
            "role": m.role,
            "joined_at": m.joined_at.isoformat() if m.joined_at else None
        }
        for m in members
    ]


@router.post("/{team_id}/members", status_code=201)
async def add_team_member(
    team_id: str,
    member_data: TeamMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Add member to team."""
    try:
        team_uuid = uuid.UUID(team_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid team ID format")
    
    # Check if member already exists
    existing = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_uuid,
            TeamMember.user_id == member_data.user_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User is already a member of this team")
    
    member = TeamMember(
        team_id=team_uuid,
        user_id=member_data.user_id,
        role=member_data.role or "member",
    )
    db.add(member)
    await db.commit()
    
    return {"message": "Member added successfully"}


@router.delete("/{team_id}/members/{user_id}", status_code=204)
async def remove_team_member(
    team_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user),
):
    """Remove member from team."""
    try:
        team_uuid = uuid.UUID(team_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid team ID format")
    
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_uuid,
            TeamMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    await db.delete(member)
    await db.commit()
