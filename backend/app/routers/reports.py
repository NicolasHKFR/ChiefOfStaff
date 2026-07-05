from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.team import Team
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
    by_team = (await db.execute(
        select(Worker.team_id, func.count(Worker.id))
        .where(Worker.status == "Active")
        .group_by(Worker.team_id)
    )).all()
    return {
        "total": total or 0,
        "by_type": [{"type": r[0], "count": r[1]} for r in by_type],
        "by_team": [{"team_id": r[0], "count": r[1]} for r in by_team],
    }
