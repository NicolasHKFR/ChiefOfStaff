from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.worker_type import WorkerType
from app.schemas.common import WorkerTypeCreate, WorkerTypeOut, WorkerTypeUpdate

router = APIRouter(prefix="/worker-types", tags=["Worker Types"])


@router.get("", response_model=list[WorkerTypeOut])
async def list_worker_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkerType).order_by(WorkerType.name))
    return result.scalars().all()


@router.post("", response_model=WorkerTypeOut, status_code=201)
async def create_worker_type(data: WorkerTypeCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(WorkerType).where(WorkerType.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "A worker type with this name already exists")
    wt = WorkerType(**data.model_dump())
    db.add(wt)
    await db.commit()
    await db.refresh(wt)
    return wt


@router.patch("/{type_id}", response_model=WorkerTypeOut)
async def update_worker_type(type_id: int, data: WorkerTypeUpdate, db: AsyncSession = Depends(get_db)):
    wt = await db.get(WorkerType, type_id)
    if not wt:
        raise HTTPException(404, "Worker type not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(wt, key, val)
    await db.commit()
    await db.refresh(wt)
    return wt


@router.delete("/{type_id}", status_code=204)
async def delete_worker_type(type_id: int, db: AsyncSession = Depends(get_db)):
    wt = await db.get(WorkerType, type_id)
    if not wt:
        raise HTTPException(404, "Worker type not found")
    await db.delete(wt)
    await db.commit()
