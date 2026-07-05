from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.worker import Worker

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/headcount")
async def headcount_report(db: AsyncSession = Depends(get_db)):
    total = await db.scalar(
        select(func.count(Worker.id)).where(Worker.status == "Active")
    )
    by_type = (await db.execute(
        select(Worker.type, func.count(Worker.id))
        .where(Worker.status == "Active")
        .group_by(Worker.type)
    )).all()
    by_dept = (await db.execute(
        select(Worker.department_id, func.count(Worker.id))
        .where(Worker.status == "Active")
        .group_by(Worker.department_id)
    )).all()
    return {
        "total": total or 0,
        "by_type": [{"type": r[0], "count": r[1]} for r in by_type],
        "by_department": [{"department_id": r[0], "count": r[1]} for r in by_dept],
    }


@router.get("/leave-stats")
async def leave_stats_report(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        text("""
            SELECT lt.name, COUNT(lr.id) as total, lr.status
            FROM leave_request lr
            JOIN leave_type lt ON lr.leave_type_id = lt.id
            GROUP BY lt.name, lr.status
            ORDER BY lt.name
        """)
    )).all()
    return [{"leave_type": r[0], "count": r[1], "status": r[2]} for r in rows]
