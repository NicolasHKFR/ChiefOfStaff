from calendar import monthrange
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.worker import Worker

router = APIRouter(prefix="/presence", tags=["Presence"])


def _month_range(year: int, month: int) -> tuple[date, date]:
    _, last = monthrange(year, month)
    return date(year, month, 1), date(year, month, last)


def _format_month(year: int, month: int) -> str:
    return f"{year}-{month:02d}"


@router.get("")
async def get_presence(db: AsyncSession = Depends(get_db)):
    today = date.today()
    start_year = today.year
    end_year = start_year + 2

    months = []
    month_dates = []
    for year in range(start_year, end_year + 1):
        for m in range(1, 13):
            months.append(_format_month(year, m))
            month_dates.append(_month_range(year, m))

    result = await db.execute(
        select(Worker)
        .where(Worker.status != "Terminated")
        .order_by(Worker.department_id, Worker.last_name)
    )
    workers = result.scalars().all()

    worker_data = []
    summary = [0] * len(months)

    for w in workers:
        presence = []
        start_idx = None
        end_idx = None
        any_present = False

        for i, (ms, me) in enumerate(month_dates):
            if w.start_date and w.start_date > me:
                present = False
            elif w.end_date and w.end_date < ms:
                present = False
            else:
                present = True

            presence.append(present)
            if present:
                if start_idx is None:
                    start_idx = i
                end_idx = i
                summary[i] += 1
                any_present = True

        worker_data.append({
                "id": w.id,
                "first_name": w.first_name,
                "last_name": w.last_name,
                "job_title": w.job_title,
                "department_id": w.department_id,
                "team_id": w.team_id,
                "manager_id": w.manager_id,
                "type": w.type,
                "status": w.status,
                "start_date": str(w.start_date) if w.start_date else None,
                "end_date": str(w.end_date) if w.end_date else None,
                "presence": presence,
                "start_idx": start_idx,
                "end_idx": end_idx,
            })

    return {
        "months": months,
        "workers": worker_data,
        "summary": summary,
    }
