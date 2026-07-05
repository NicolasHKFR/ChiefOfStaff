from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import (
    audit,
    documents,
    export,
    org_chart,
    positions,
    presence,
    reports,
    search,
    skills,
    teams,
    workers,
)
from app.utils.audit import setup_audit

app = FastAPI(title=settings.app_name)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(workers.router)
app.include_router(org_chart.router)
app.include_router(presence.router)
app.include_router(teams.router)
app.include_router(positions.router)
app.include_router(skills.router)
app.include_router(documents.router)
app.include_router(reports.router)
app.include_router(export.router)
app.include_router(search.router)
app.include_router(audit.router)


@app.on_event("startup")
async def startup():
    setup_audit()


@app.get("/")
async def root():
    return {"app": settings.app_name, "status": "ok"}
