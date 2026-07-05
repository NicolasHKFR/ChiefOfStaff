"""Seed the database with sample data for development."""
import asyncio
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory, engine
from app.database import Base
from app.models.location import Location
from app.models.organization import Organization
from app.models.skill import Skill
from app.models.team import Team
from app.models.worker import Worker, WorkerSkill
from app.models.worker_type import WorkerType


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
            start_date=date(2020, 1, 15), status="Active",
        )
        db.add(ceo)
        await db.flush()

        eng_lead = Worker(
            type="Employee", first_name="Jordan", last_name="Patel",
            start_date=date(2020, 3, 1), status="Active",
        )
        mkt_lead = Worker(
            type="Employee", first_name="Morgan", last_name="Taylor",
            start_date=date(2020, 3, 1), status="Active",
        )
        hr_lead = Worker(
            type="Employee", first_name="Sam", last_name="Williams",
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

        locations_data = [
            ("Dubai Office", "Dubai, UAE", "UAE", 25.2048, 55.2708),
            ("Bangalore Hub", "Bangalore, India", "India", 12.9716, 77.5946),
            ("Singapore Office", "Singapore", "Singapore", 1.3521, 103.8198),
            ("Hong Kong Office", "Hong Kong", "Hong Kong", 22.3193, 114.1694),
            ("Tokyo Office", "Tokyo, Japan", "Japan", 35.6762, 139.6503),
            ("Sydney Office", "Sydney, Australia", "Australia", -33.8688, 151.2093),
            ("Auckland Office", "Auckland, New Zealand", "New Zealand", -36.8485, 174.7633),
        ]
        locations = {}
        for name, addr, country, lat, lng in locations_data:
            loc = Location(name=name, address=addr, country=country, latitude=lat, longitude=lng)
            db.add(loc)
            locations[name] = loc
        await db.flush()

        db.add_all([
            Worker(type="Employee", first_name="Riley", last_name="Kim",
                   team_id=frontend.id, start_date=date(2021, 2, 1), status="Active",
                   office_location="Tokyo Office"),
            Worker(type="Employee", first_name="Casey", last_name="Nguyen",
                   team_id=backend.id, start_date=date(2022, 4, 1), status="Active",
                   office_location="Bangalore Hub"),
            Worker(type="Contractor", first_name="Drew", last_name="Martinez",
                   team_id=backend.id, start_date=date(2023, 1, 1), status="Active",
                   office_location="Dubai Office"),
            Worker(type="Employee", first_name="Jamie", last_name="Rodriguez",
                   team_id=content.id, start_date=date(2022, 9, 1), status="Active",
                   office_location="Singapore Office"),
            Worker(type="Employee", first_name="Taylor", last_name="Brown",
                   team_id=content.id, start_date=date(2023, 6, 15), status="Active",
                   office_location="Sydney Office"),
            Worker(type="Employee", first_name="Avery", last_name="Garcia",
                   team_id=recruiting.id, start_date=date(2022, 1, 10), status="Active",
                   office_location="Hong Kong Office"),
            Worker(type="Employee", first_name="Morgan", last_name="Taylor",
                   team_id=content.id, start_date=date(2020, 3, 1), status="Active",
                   office_location="Auckland Office"),
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

        worker_types = [WorkerType(name=n) for n in ("Employee", "Contractor")]
        db.add_all(worker_types)
        await db.flush()

        await db.commit()

    print("Seed data loaded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
