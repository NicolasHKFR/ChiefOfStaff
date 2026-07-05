from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.team import Team
from app.models.worker import Worker

router = APIRouter(prefix="/org-chart", tags=["Org Chart"])


async def _build_team_tree(db: AsyncSession):
    result = await db.execute(
        select(Team).order_by(Team.id)
    )
    teams = result.scalars().all()

    team_map = {}
    for t in teams:
        team_map[t.id] = {
            "id": t.id,
            "name": t.name,
            "manager": None,
            "members": [],
            "children": [],
        }

    workers_result = await db.execute(
        select(Worker).where(Worker.status != "Terminated").order_by(Worker.last_name)
    )
    workers = workers_result.scalars().all()
    worker_by_id = {w.id: w for w in workers}

    for w in workers:
        if w.team_id and w.team_id in team_map:
            team_map[w.team_id]["members"].append({
                "id": w.id,
                "first_name": w.first_name,
                "last_name": w.last_name,
                "photo_url": w.photo_url,
            })

    roots = []
    for t in teams:
        node = team_map[t.id]
        if t.manager_id and t.manager_id in worker_by_id:
            mgr = worker_by_id[t.manager_id]
            node["manager"] = {
                "id": mgr.id,
                "first_name": mgr.first_name,
                "last_name": mgr.last_name,
                "photo_url": mgr.photo_url,
            }
        if t.parent_team_id and t.parent_team_id in team_map:
            team_map[t.parent_team_id]["children"].append(node)
        else:
            roots.append(node)

    return roots


@router.get("")
async def get_org_chart(db: AsyncSession = Depends(get_db)):
    return await _build_team_tree(db)
