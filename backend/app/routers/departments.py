from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.department import Department
from app.schemas.common import DepartmentCreate, DepartmentOut, DepartmentUpdate

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("", response_model=list[DepartmentOut])
async def list_departments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department).order_by(Department.name))
    return result.scalars().all()


@router.get("/{department_id}", response_model=DepartmentOut)
async def get_department(department_id: int, db: AsyncSession = Depends(get_db)):
    dept = await db.get(Department, department_id)
    if not dept:
        raise HTTPException(404, "Department not found")
    return dept


@router.post("", response_model=DepartmentOut, status_code=201)
async def create_department(data: DepartmentCreate, db: AsyncSession = Depends(get_db)):
    dept = Department(**data.model_dump())
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept


@router.patch("/{department_id}", response_model=DepartmentOut)
async def update_department(
    department_id: int, data: DepartmentUpdate, db: AsyncSession = Depends(get_db)
):
    dept = await db.get(Department, department_id)
    if not dept:
        raise HTTPException(404, "Department not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(dept, key, val)
    await db.commit()
    await db.refresh(dept)
    return dept
