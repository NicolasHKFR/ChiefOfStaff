from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.document import Document
from app.models.team import Team
from app.models.worker import Worker, WorkerSkill
from app.schemas.common import WorkerCreate, WorkerOut, WorkerUpdate

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
    vals = data.model_dump()
    for key in ("photo_url", "office_location"):
        if vals.get(key) == "":
            vals[key] = None
    worker = Worker(**vals)
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
    update_data = data.model_dump(exclude_unset=True)
    if "start_date" in update_data:
        worker.start_date = data.start_date
    if "end_date" in update_data:
        worker.end_date = data.end_date
    for key in ("start_date", "end_date"):
        update_data.pop(key, None)
    for key, val in update_data.items():
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
