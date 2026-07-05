from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter(prefix="/org-chart", tags=["Org Chart"])


@router.get("")
async def get_org_chart(db: AsyncSession = Depends(get_db)):
    query = text("""
        WITH RECURSIVE org_tree AS (
            SELECT id, first_name, last_name, job_title, photo_url, manager_id, 0 AS depth
            FROM worker WHERE manager_id IS NULL AND status != 'Terminated'
            UNION ALL
            SELECT w.id, w.first_name, w.last_name, w.job_title, w.photo_url, w.manager_id, ot.depth + 1
            FROM worker w
            JOIN org_tree ot ON w.manager_id = ot.id
            WHERE w.status != 'Terminated'
        )
        SELECT * FROM org_tree ORDER BY depth
    """)
    result = await db.execute(query)
    rows = result.mappings().all()

    nodes = {}
    roots = []
    for row in rows:
        node = {
            "id": row["id"],
            "first_name": row["first_name"],
            "last_name": row["last_name"],
            "job_title": row["job_title"],
            "photo_url": row["photo_url"],
            "children": [],
        }
        nodes[row["id"]] = node
        if row["manager_id"] is None:
            roots.append(node)
        else:
            parent = nodes.get(row["manager_id"])
            if parent:
                parent["children"].append(node)

    return roots[0] if len(roots) == 1 else roots
