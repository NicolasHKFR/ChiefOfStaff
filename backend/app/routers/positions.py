from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.position import Position
from app.schemas.common import PositionCreate, PositionOut, PositionUpdate

router = APIRouter(prefix="/positions", tags=["Positions"])


@router.get("", response_model=list[PositionOut])
async def list_positions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Position).order_by(Position.job_title))
    return result.scalars().all()


@router.get("/{position_id}", response_model=PositionOut)
async def get_position(position_id: int, db: AsyncSession = Depends(get_db)):
    pos = await db.get(Position, position_id)
    if not pos:
        raise HTTPException(404, "Position not found")
    return pos


@router.post("", response_model=PositionOut, status_code=201)
async def create_position(data: PositionCreate, db: AsyncSession = Depends(get_db)):
    pos = Position(**data.model_dump())
    db.add(pos)
    await db.commit()
    await db.refresh(pos)
    return pos


@router.patch("/{position_id}", response_model=PositionOut)
async def update_position(
    position_id: int, data: PositionUpdate, db: AsyncSession = Depends(get_db)
):
    pos = await db.get(Position, position_id)
    if not pos:
        raise HTTPException(404, "Position not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(pos, key, val)
    await db.commit()
    await db.refresh(pos)
    return pos
