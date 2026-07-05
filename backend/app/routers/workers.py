from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.document import Document
from app.models.team import Team
from app.models.worker import Worker, WorkerSkill
from app.schemas.common import WorkerCreate, WorkerOut, WorkerUpdate

DUPLICATE_MSG = "A worker with this email already exists"

router = APIRouter(prefix="/workers", tags=["Workers"])


@router.get("", response_model=list[WorkerOut])
async def list_workers(
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Worker)
    if status:
        stmt = stmt.where(Worker.status == status)
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(
            Worker.first_name.ilike(pattern)
            | Worker.last_name.ilike(pattern)
            | Worker.email.ilike(pattern)
        )
    stmt = stmt.order_by(Worker.last_name, Worker.first_name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{worker_id}", response_model=WorkerOut)
async def get_worker(worker_id: int, db: AsyncSession = Depends(get_db)):
    worker = await db.get(Worker, worker_id)
    if not worker:
        raise HTTPException(404, "Worker not found")
    return worker


@router.post("", response_model=WorkerOut, status_code=201)
async def create_worker(data: WorkerCreate, db: AsyncSession = Depends(get_db)):
    if data.email:
        existing = await db.execute(select(Worker).where(Worker.email == data.email))
        if existing.scalar_one_or_none():
            raise HTTPException(409, DUPLICATE_MSG)
    worker = Worker(**data.model_dump())
    db.add(worker)
    await db.commit()
    await db.refresh(worker)
    return worker


@router.patch("/{worker_id}", response_model=WorkerOut)
async def update_worker(
    worker_id: int, data: WorkerUpdate, db: AsyncSession = Depends(get_db)
):
    worker = await db.get(Worker, worker_id)
    if not worker:
        raise HTTPException(404, "Worker not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(worker, key, val)
    await db.commit()
    await db.refresh(worker)
    return worker


@router.delete("/{worker_id}", status_code=204)
async def delete_worker(worker_id: int, db: AsyncSession = Depends(get_db)):
    worker = await db.get(Worker, worker_id)
    if not worker:
        raise HTTPException(404, "Worker not found")

    await db.execute(WorkerSkill.__table__.delete().where(WorkerSkill.worker_id == worker_id))
    await db.execute(Document.__table__.delete().where(Document.worker_id == worker_id))
    await db.execute(Team.__table__.update().where(Team.manager_id == worker_id).values(manager_id=None))

    await db.delete(worker)
    await db.commit()
