import asyncio
import os
import tempfile
from datetime import date
from pathlib import Path
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import NullPool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models.audit_log import AuditLog
from app.utils.audit import setup_audit
from app.models.document import Document
from app.models.organization import Organization
from app.models.skill import Skill
from app.models.team import Team
from app.models.worker import Worker, WorkerSkill

_db_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.close(_db_fd)
TEST_DB_URL = f"sqlite+aiosqlite:///{Path(_db_path).as_posix()}"

engine = create_async_engine(TEST_DB_URL, echo=False, poolclass=NullPool)
async_session_factory_test = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory_test() as session:
        try:
            yield session
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db
setup_audit()


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory_test() as session:
        yield session


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def seed_db(db: AsyncSession):
    org = Organization(name="TestCorp")
    org.settings = {"locale": "en-US"}
    db.add(org)
    await db.flush()

    ceo = Worker(type="Employee", first_name="Alice", last_name="CEO",
                 email="ceo@test.com",
                 start_date=date(2020, 1, 1), status="Active")
    db.add(ceo)
    await db.flush()

    mgr = Worker(type="Employee", first_name="Bob", last_name="Manager",
                 email="bob@test.com",
                 start_date=date(2021, 1, 1),
                 status="Active")
    db.add(mgr)
    await db.flush()

    root = Team(name="Root", manager_id=ceo.id)
    db.add(root)
    await db.flush()

    frontend = Team(name="Frontend", manager_id=mgr.id, parent_team_id=root.id)
    backend_t = Team(name="Backend", parent_team_id=root.id)
    db.add_all([frontend, backend_t])
    await db.flush()

    ic = Worker(type="Employee", first_name="Charlie", last_name="IC",
                email="charlie@test.com",
                team_id=frontend.id, start_date=date(2022, 6, 15),
                status="Active")
    db.add(ic)
    await db.flush()

    contractor = Worker(type="Contractor", first_name="Diana", last_name="Contractor",
                        email="diana@test.com",
                        team_id=backend_t.id,
                        start_date=date(2023, 1, 1), end_date=date(2024, 12, 31),
                        status="Active")
    db.add(contractor)
    await db.flush()

    terminated = Worker(type="Employee", first_name="Eve", last_name="Gone",
                        email="eve@test.com",
                        start_date=date(2019, 1, 1), end_date=date(2023, 6, 1),
                        status="Terminated")
    db.add(terminated)
    await db.flush()

    python = Skill(name="Python", category="Backend")
    react = Skill(name="React", category="Frontend")
    docker = Skill(name="Docker", category="DevOps")
    db.add_all([python, react, docker])
    await db.flush()

    db.add(WorkerSkill(worker_id=ic.id, skill_id=python.id, proficiency_level="Advanced"))
    db.add(WorkerSkill(worker_id=ic.id, skill_id=react.id, proficiency_level="Intermediate"))
    await db.commit()

    return {
        "org": org,
        "ceo": ceo, "mgr": mgr, "ic": ic,
        "contractor": contractor, "terminated": terminated,
        "root": root, "frontend": frontend, "backend_t": backend_t,
        "python": python, "react": react, "docker": docker,
    }


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_db():
    yield
    engine.sync_engine.dispose()
    import time
    for _ in range(5):
        try:
            if os.path.exists(_db_path):
                os.unlink(_db_path)
            return
        except PermissionError:
            time.sleep(0.5)
