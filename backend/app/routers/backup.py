import shutil
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.database import engine

router = APIRouter(prefix="/backup", tags=["Backup"])

parsed = urlparse(settings.database_url.replace("+aiosqlite", ""))
db_rel = parsed.path.lstrip("/")
DB_PATH = Path(db_rel).resolve()
BACKUP_DIR = DB_PATH.parent / "backups"


def _ensure_dir():
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)


@router.get("")
async def list_backups():
    _ensure_dir()
    backups = []
    for f in sorted(BACKUP_DIR.iterdir(), reverse=True):
        if f.suffix == ".db":
            stat = f.stat()
            backups.append({
                "filename": f.name,
                "size": stat.st_size,
                "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            })
    return backups


@router.post("")
async def create_backup():
    _ensure_dir()
    if not DB_PATH.exists():
        raise HTTPException(400, "Database file not found")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = BACKUP_DIR / f"cosixis_{timestamp}.db"
    shutil.copy2(DB_PATH, dest)
    return {"filename": dest.name, "message": "Backup created"}


@router.post("/restore/{filename}")
async def restore_backup(filename: str):
    _ensure_dir()
    src = BACKUP_DIR / filename
    if not src.exists():
        raise HTTPException(404, "Backup file not found")
    shutil.copy2(src, DB_PATH)
    await engine.dispose()
    return {"message": f"Restored from {filename}"}
