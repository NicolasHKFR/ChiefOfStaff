from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.team import Team
from app.models.worker import Worker
from app.schemas.common import TeamCreate, TeamOut, TeamUpdate

ROOT_NAME = "Root"

router = APIRouter(prefix="/teams", tags=["Teams"])


def _check_not_root(team: Team):
    if team.name == ROOT_NAME:
        raise HTTPException(403, "The Root team is protected and cannot be modified")


@router.get("", response_model=list[TeamOut])
async def list_teams(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Team).order_by(Team.name))
    return result.scalars().all()


@router.get("/{team_id}", response_model=TeamOut)
async def get_team(team_id: int, db: AsyncSession = Depends(get_db)):
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(404, "Team not found")
    return team


@router.post("", response_model=TeamOut, status_code=201)
async def create_team(data: TeamCreate, db: AsyncSession = Depends(get_db)):
    team = Team(**data.model_dump())
    db.add(team)
    await db.commit()
    await db.refresh(team)
    return team


@router.patch("/{team_id}", response_model=TeamOut)
async def update_team(team_id: int, data: TeamUpdate, db: AsyncSession = Depends(get_db)):
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(404, "Team not found")
    _check_not_root(team)
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(team, key, val)
    await db.commit()
    await db.refresh(team)
    return team


@router.delete("/{team_id}", status_code=204)
async def delete_team(team_id: int, db: AsyncSession = Depends(get_db)):
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(404, "Team not found")
    _check_not_root(team)
    await db.execute(Team.__table__.update().where(Team.parent_team_id == team_id).values(parent_team_id=None))
    await db.execute(Worker.__table__.update().where(Worker.team_id == team_id).values(team_id=None))
    await db.delete(team)
    await db.commit()



