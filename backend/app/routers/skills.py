from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.skill import Skill
from app.schemas.common import SkillCreate, SkillOut

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.get("", response_model=list[SkillOut])
async def list_skills(q: str | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Skill).order_by(Skill.name)
    if q:
        stmt = stmt.where(Skill.name.ilike(f"%{q}%"))
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=SkillOut, status_code=201)
async def create_skill(data: SkillCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Skill).where(Skill.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Skill with this name already exists")
    skill = Skill(**data.model_dump())
    db.add(skill)
    await db.commit()
    await db.refresh(skill)
    return skill


@router.get("/{skill_id}", response_model=SkillOut)
async def get_skill(skill_id: int, db: AsyncSession = Depends(get_db)):
    skill = await db.get(Skill, skill_id)
    if not skill:
        raise HTTPException(404, "Skill not found")
    return skill
