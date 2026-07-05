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
from app.models.department import Department
from app.models.document import Document
from app.models.leave import LeaveRequest, LeaveType
from app.models.organization import Organization
from app.models.position import Position
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

    eng = Department(organization_id=org.id, name="Engineering")
    hr = Department(organization_id=org.id, name="HR")
    db.add_all([eng, hr])
    await db.flush()

    frontend = Team(department_id=eng.id, name="Frontend")
    backend_t = Team(department_id=eng.id, name="Backend")
    db.add_all([frontend, backend_t])
    await db.flush()

    ceo = Worker(type="Employee", first_name="Alice", last_name="CEO",
                 email="ceo@test.com", job_title="CEO",
                 start_date=date(2020, 1, 1), status="Active")
    db.add(ceo)
    await db.flush()

    mgr = Worker(type="Employee", first_name="Bob", last_name="Manager",
                 email="bob@test.com", job_title="Engineering Manager",
                 department_id=eng.id, team_id=frontend.id,
                 manager_id=ceo.id, start_date=date(2021, 1, 1),
                  status="Active")
    db.add(mgr)
    await db.flush()

    ic = Worker(type="Employee", first_name="Charlie", last_name="IC",
                email="charlie@test.com", job_title="Engineer",
                department_id=eng.id, team_id=frontend.id,
                 manager_id=mgr.id, start_date=date(2022, 6, 15),
                 status="Active")
    db.add(ic)
    await db.flush()

    contractor = Worker(type="Contractor", first_name="Diana", last_name="Contractor",
                        email="diana@test.com", job_title="DevOps",
                        department_id=eng.id, team_id=backend_t.id,
                        manager_id=mgr.id, start_date=date(2023, 1, 1),
                        end_date=date(2024, 12, 31), status="Active")
    db.add(contractor)
    await db.flush()

    terminated = Worker(type="Employee", first_name="Eve", last_name="Gone",
                        email="eve@test.com", job_title="Former",
                        start_date=date(2019, 1, 1), end_date=date(2023, 6, 1),
                        status="Terminated")
    db.add(terminated)
    await db.flush()

    on_leave = Worker(type="Employee", first_name="Frank", last_name="Leave",
                      email="frank@test.com", job_title="On Leave",
                      department_id=hr.id, manager_id=ceo.id,
                      start_date=date(2022, 3, 1), status="On Leave")
    db.add(on_leave)
    await db.flush()

    python = Skill(name="Python", category="Backend")
    react = Skill(name="React", category="Frontend")
    docker = Skill(name="Docker", category="DevOps")
    db.add_all([python, react, docker])
    await db.flush()

    db.add(WorkerSkill(worker_id=ic.id, skill_id=python.id, proficiency_level="Advanced"))
    db.add(WorkerSkill(worker_id=ic.id, skill_id=react.id, proficiency_level="Intermediate"))
    await db.flush()

    pos1 = Position(job_title="Senior Engineer", department_id=eng.id,
                    team_id=frontend.id, status="Vacant", employment_type="Full-time")
    pos2 = Position(job_title="Intern", department_id=hr.id, status="Planned")
    db.add_all([pos1, pos2])
    await db.flush()

    annual = LeaveType(name="Annual Leave", requires_approval=1)
    sick = LeaveType(name="Sick Leave", requires_approval=0)
    db.add_all([annual, sick])
    await db.flush()

    lr1 = LeaveRequest(worker_id=ic.id, leave_type_id=annual.id,
                       start_date=date(2026, 7, 10), end_date=date(2026, 7, 14),
                       comment="Vacation", status="Pending")
    lr2 = LeaveRequest(worker_id=mgr.id, leave_type_id=sick.id,
                       start_date=date(2026, 6, 5), end_date=date(2026, 6, 5),
                       status="Approved", approver_id=ceo.id)
    db.add_all([lr1, lr2])
    await db.commit()

    return {
        "org": org, "eng": eng, "hr": hr,
        "frontend": frontend, "backend_t": backend_t,
        "ceo": ceo, "mgr": mgr, "ic": ic,
        "contractor": contractor, "terminated": terminated, "on_leave": on_leave,
        "python": python, "react": react, "docker": docker,
        "pos1": pos1, "pos2": pos2,
        "annual": annual, "sick": sick,
        "lr1": lr1, "lr2": lr2,
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
