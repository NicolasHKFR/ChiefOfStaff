from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.team import Team
from app.models.worker import Worker

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("")
async def global_search(q: str = Query(min_length=1), db: AsyncSession = Depends(get_db)):
    pattern = f"%{q}%"
    results = {}

    workers = await db.execute(
        select(Worker)
        .where(
            Worker.first_name.ilike(pattern)
            | Worker.last_name.ilike(pattern)
        )
        .limit(20)
    )
    results["workers"] = [
        {"id": w.id, "label": f"{w.first_name} {w.last_name}", "type": "Worker"}
        for w in workers.scalars().all()
    ]

    teams = await db.execute(
        select(Team).where(Team.name.ilike(pattern)).limit(10)
    )
    results["teams"] = [
        {"id": t.id, "label": t.name, "type": "Team"}
        for t in teams.scalars().all()
    ]

    return results
