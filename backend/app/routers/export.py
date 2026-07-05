from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.worker import Worker
from app.utils.export import export_csv, export_xlsx

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/workers")
async def export_workers(
    format: str = Query("csv"),
    db: AsyncSession = Depends(get_db),
):
    if format not in ("csv", "xlsx"):
        raise HTTPException(400, "Format must be csv or xlsx")
    result = await db.execute(
        select(Worker).where(Worker.status == "Active").order_by(Worker.last_name)
    )
    workers = result.scalars().all()
    columns = [
        "ID", "Type", "First Name", "Last Name", "Email", "Phone",
        "Job Title", "Team ID", "Manager ID",
        "Employment Type", "Status", "Office Location",
    ]
    rows = [
        [
            w.id, w.type, w.first_name, w.last_name, w.email or "",
            w.phone or "", w.job_title or "", w.team_id or "",
            w.manager_id or "", w.employment_type or "",
            w.status, w.office_location or "",
        ]
        for w in workers
    ]
    if format == "csv":
        content = export_csv(columns, rows)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=workers.csv"},
        )
    content = export_xlsx(columns, rows)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=workers.xlsx"},
    )
