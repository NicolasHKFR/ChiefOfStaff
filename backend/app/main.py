from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.routers import (
    audit,
    backup,
    documents,
    export,
    locations,
    org_chart,
    presence,
    quality_checks,
    reports,
    search,
    skills,
    teams,
    worker_types,
    workers,
)
from app.utils.audit import setup_audit

app = FastAPI(title=settings.app_name)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(workers.router)
app.include_router(org_chart.router)
app.include_router(presence.router)
app.include_router(teams.router)
app.include_router(skills.router)
app.include_router(documents.router)
app.include_router(reports.router)
app.include_router(export.router)
app.include_router(search.router)
app.include_router(audit.router)
app.include_router(quality_checks.router)
app.include_router(locations.router)
app.include_router(worker_types.router)
app.include_router(backup.router)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    setup_audit()


@app.get("/")
async def root():
    return {"app": settings.app_name, "status": "ok"}
