from sqlalchemy import inspect
from sqlalchemy.event import listen
from sqlalchemy.orm import Mapper

from app.config import settings
from app.models.audit_log import AuditLog


def _log_change(session, entity_type, entity_id, field, old, new):
    if old == new:
        return
    log = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        field_changed=field,
        previous_value=str(old) if old is not None else None,
        new_value=str(new) if new is not None else None,
        changed_by=settings.default_user_id,
    )
    session.add(log)


def receive_before_flush(session, flush_context, instances):
    for target in session.dirty:
        if not hasattr(target, '__tablename__'):
            continue
        mapper = inspect(target)
        entity_name = type(target).__name__
        watched = {"Worker", "Team", "Position"}
        if entity_name not in watched:
            continue
        for attr in mapper.attrs:
            hist = attr.load_history()
            if hist.has_changes():
                old = hist.deleted[0] if hist.deleted else None
                new = hist.added[0] if hist.added else None
                if old != new:
                    _log_change(
                        session, entity_name, target.id, attr.key, old, new,
                    )


def setup_audit():
    from sqlalchemy.orm import Session
    listen(Session, "before_flush", receive_before_flush)
