from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.audit_log import AuditLog
from app.schemas.common import AuditLogOut

router = APIRouter(prefix="/audit-log", tags=["Audit"])


@router.get("/{entity_type}/{entity_id}", response_model=list[AuditLogOut])
async def get_audit_log(
    entity_type: str,
    entity_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == entity_type,
            AuditLog.entity_id == entity_id,
        )
        .order_by(AuditLog.changed_at.desc())
    )
    return result.scalars().all()
