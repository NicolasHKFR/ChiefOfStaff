"""Seed the database with sample data for development."""
import asyncio
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory, engine
from app.database import Base
from app.models.organization import Organization
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

        ceo = Worker(
            type="Employee", first_name="Alex", last_name="Chen",
            email="alex@cosixis.io",
            start_date=date(2020, 1, 15), status="Active",
        )
        db.add(ceo)
        await db.flush()

        eng_lead = Worker(
            type="Employee", first_name="Jordan", last_name="Patel",
            email="jordan@cosixis.io",
            start_date=date(2020, 3, 1), status="Active",
        )
        mkt_lead = Worker(
            type="Employee", first_name="Morgan", last_name="Taylor",
            email="morgan@cosixis.io",
            start_date=date(2020, 3, 1), status="Active",
        )
        hr_lead = Worker(
            type="Employee", first_name="Sam", last_name="Williams",
            email="sam@cosixis.io",
            start_date=date(2021, 6, 1), status="Active",
        )
        db.add_all([eng_lead, mkt_lead, hr_lead])
        await db.flush()

        root = Team(name="Root", manager_id=ceo.id)
        db.add(root)
        await db.flush()

        exec = Team(name="Executive", manager_id=ceo.id, parent_team_id=root.id)
        frontend = Team(name="Frontend", manager_id=eng_lead.id, parent_team_id=root.id)
        backend = Team(name="Backend", manager_id=eng_lead.id, parent_team_id=root.id)
        content = Team(name="Content", manager_id=mkt_lead.id, parent_team_id=root.id)
        recruiting = Team(name="Recruiting", manager_id=hr_lead.id, parent_team_id=root.id)
        db.add_all([exec, frontend, backend, content, recruiting])
        await db.flush()

        db.add_all([
            Worker(type="Employee", first_name="Riley", last_name="Kim", email="riley@cosixis.io",
                   team_id=frontend.id, start_date=date(2021, 2, 1), status="Active"),
            Worker(type="Employee", first_name="Casey", last_name="Nguyen", email="casey@cosixis.io",
                   team_id=backend.id, start_date=date(2022, 4, 1), status="Active"),
            Worker(type="Contractor", first_name="Drew", last_name="Martinez", email="drew@cosixis.io",
                   team_id=backend.id, start_date=date(2023, 1, 1), status="Active"),
            Worker(type="Employee", first_name="Jamie", last_name="Rodriguez", email="jamie@cosixis.io",
                   team_id=content.id, start_date=date(2022, 9, 1), status="Active"),
            Worker(type="Employee", first_name="Taylor", last_name="Brown", email="taylor@cosixis.io",
                   team_id=content.id, start_date=date(2023, 6, 15), status="Active"),
            Worker(type="Employee", first_name="Avery", last_name="Garcia", email="avery@cosixis.io",
                   team_id=recruiting.id, start_date=date(2022, 1, 10), status="Active"),
        ])
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

        await db.commit()

    print("Seed data loaded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
