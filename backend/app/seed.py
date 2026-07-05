"""Seed the database with sample data for development."""
import asyncio
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory, engine
from app.database import Base
from app.models.department import Department
from app.models.leave import LeaveRequest, LeaveType
from app.models.organization import Organization
from app.models.position import Position
from app.models.skill import Skill
from app.models.team import Team
from app.models.worker import Worker, WorkerSkill


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        org = Organization(name="Cosixis Inc.")
        org.settings = {"locale": "en-US", "fiscal_year": "calendar"}
        db.add(org)
        await db.flush()

        eng = Department(organization_id=org.id, name="Engineering")
        mkt = Department(organization_id=org.id, name="Marketing")
        hr = Department(organization_id=org.id, name="HR & Operations")
        db.add_all([eng, mkt, hr])
        await db.flush()

        frontend = Team(department_id=eng.id, name="Frontend")
        backend = Team(department_id=eng.id, name="Backend")
        content = Team(department_id=mkt.id, name="Content")
        recruiting = Team(department_id=hr.id, name="Recruiting")
        db.add_all([frontend, backend, content, recruiting])
        await db.flush()

        ceo = Worker(
            type="Employee", first_name="Alex", last_name="Chen",
            email="alex@cosixis.io", job_title="CEO",
            start_date=date(2020, 1, 15), status="Active",
        )
        db.add(ceo)
        await db.flush()

        cto = Worker(
            type="Employee", first_name="Jordan", last_name="Patel",
            email="jordan@cosixis.io", job_title="CTO",
            department_id=eng.id, manager_id=ceo.id,
            start_date=date(2020, 3, 1), status="Active", annual_salary=180000,
        )
        cmo = Worker(
            type="Employee", first_name="Morgan", last_name="Taylor",
            email="morgan@cosixis.io", job_title="CMO",
            department_id=mkt.id, manager_id=ceo.id,
            start_date=date(2020, 3, 1), status="Active", annual_salary=175000,
        )
        hr_head = Worker(
            type="Employee", first_name="Sam", last_name="Williams",
            email="sam@cosixis.io", job_title="Head of People",
            department_id=hr.id, manager_id=ceo.id,
            start_date=date(2021, 6, 1), status="Active", annual_salary=140000,
        )
        db.add_all([cto, cmo, hr_head])
        await db.flush()

        engineers = [
            Worker(type="Employee", first_name="Riley", last_name="Kim", email="riley@cosixis.io",
                   job_title="Senior Frontend Engineer", department_id=eng.id, team_id=frontend.id,
                   manager_id=cto.id, start_date=date(2021, 2, 1), status="Active", annual_salary=135000),
            Worker(type="Employee", first_name="Casey", last_name="Nguyen", email="casey@cosixis.io",
                   job_title="Backend Engineer", department_id=eng.id, team_id=backend.id,
                   manager_id=cto.id, start_date=date(2022, 4, 1), status="Active", annual_salary=120000),
            Worker(type="Contractor", first_name="Drew", last_name="Martinez", email="drew@cosixis.io",
                   job_title="DevOps Engineer", department_id=eng.id, team_id=backend.id,
                   manager_id=cto.id, start_date=date(2023, 1, 1), status="Active",
                   supplier_agency_name="CloudStaff Inc.", rate_type="Daily", rate_amount=650),
        ]
        db.add_all(engineers)
        await db.flush()

        marketers = [
            Worker(type="Employee", first_name="Jamie", last_name="Rodriguez", email="jamie@cosixis.io",
                   job_title="Content Lead", department_id=mkt.id, team_id=content.id,
                   manager_id=cmo.id, start_date=date(2022, 9, 1), status="Active", annual_salary=95000),
            Worker(type="Employee", first_name="Taylor", last_name="Brown", email="taylor@cosixis.io",
                   job_title="Marketing Designer", department_id=mkt.id, team_id=content.id,
                   manager_id=cmo.id, start_date=date(2023, 6, 15), status="Active", annual_salary=85000),
        ]
        db.add_all(marketers)
        await db.flush()

        ops = [
            Worker(type="Employee", first_name="Avery", last_name="Garcia", email="avery@cosixis.io",
                   job_title="Recruiter", department_id=hr.id, team_id=recruiting.id,
                   manager_id=hr_head.id, start_date=date(2022, 1, 10), status="Active", annual_salary=75000),
        ]
        db.add_all(ops)
        await db.flush()

        skills_data = [
            ("React", "Frontend"), ("TypeScript", "Frontend"), ("Python", "Backend"),
            ("PostgreSQL", "Backend"), ("Docker", "DevOps"), ("AWS", "DevOps"),
            ("Content Writing", "Marketing"), ("UI Design", "Design"),
            ("Recruiting", "HR"), ("People Management", "Management"),
        ]
        skills = [Skill(name=name, category=cat) for name, cat in skills_data]
        db.add_all(skills)
        await db.flush()

        positions_data = [
            Position(job_title="Senior Backend Engineer", department_id=eng.id, team_id=backend.id,
                     status="Vacant", employment_type="Full-time"),
            Position(job_title="Product Manager", department_id=eng.id, status="Planned",
                     target_start_date=date(2026, 9, 1)),
            Position(job_title="Marketing Intern", department_id=mkt.id, team_id=content.id,
                     status="Vacant", employment_type="Intern"),
        ]
        db.add_all(positions_data)
        await db.flush()

        leave_types = [
            LeaveType(name="Annual Leave", requires_approval=1),
            LeaveType(name="Sick Leave", requires_approval=0),
            LeaveType(name="Personal Leave", requires_approval=1),
        ]
        db.add_all(leave_types)
        await db.flush()

        leave_requests = [
            LeaveRequest(worker_id=engineers[0].id, leave_type_id=1,
                         start_date=date(2026, 7, 10), end_date=date(2026, 7, 14),
                         comment="Vacation", status="Pending"),
            LeaveRequest(worker_id=engineers[1].id, leave_type_id=2,
                         start_date=date(2026, 6, 5), end_date=date(2026, 6, 5),
                         comment="Doctor appointment", status="Approved",
                         approver_id=cto.id),
        ]
        db.add_all(leave_requests)
        await db.commit()

    print("Seed data loaded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
