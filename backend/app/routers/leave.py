from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.leave import LeaveRequest, LeaveType
from app.schemas.common import LeaveRequestCreate, LeaveRequestOut, LeaveTypeOut

router = APIRouter(prefix="/leave-requests", tags=["Leave"])


@router.get("/types", response_model=list[LeaveTypeOut])
async def list_leave_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LeaveType).order_by(LeaveType.name))
    return result.scalars().all()


@router.get("", response_model=list[LeaveRequestOut])
async def list_leave_requests(
    worker_id: int | None = None, db: AsyncSession = Depends(get_db)
):
    stmt = select(LeaveRequest).order_by(LeaveRequest.start_date.desc())
    if worker_id:
        stmt = stmt.where(LeaveRequest.worker_id == worker_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=LeaveRequestOut, status_code=201)
async def create_leave_request(
    data: LeaveRequestCreate, db: AsyncSession = Depends(get_db)
):
    leave_type = await db.get(LeaveType, data.leave_type_id)
    if not leave_type:
        raise HTTPException(400, "Invalid leave type")
    lr = LeaveRequest(**data.model_dump())
    db.add(lr)
    await db.commit()
    await db.refresh(lr)
    return lr


@router.patch("/{leave_id}", response_model=LeaveRequestOut)
async def update_leave_status(
    leave_id: int,
    status: str,
    approver_id: int,
    db: AsyncSession = Depends(get_db),
):
    lr = await db.get(LeaveRequest, leave_id)
    if not lr:
        raise HTTPException(404, "Leave request not found")
    if status not in ("Approved", "Rejected"):
        raise HTTPException(400, "Status must be Approved or Rejected")
    lr.status = status
    lr.approver_id = approver_id
    lr.decided_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(lr)
    return lr
