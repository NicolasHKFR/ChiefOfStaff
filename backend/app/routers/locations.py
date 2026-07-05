from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.location import Location
from app.schemas.common import LocationCreate, LocationOut, LocationUpdate

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("", response_model=list[LocationOut])
async def list_locations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Location).order_by(Location.name))
    return result.scalars().all()


@router.post("", response_model=LocationOut, status_code=201)
async def create_location(data: LocationCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Location).where(Location.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "A location with this name already exists")
    loc = Location(**data.model_dump())
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    return loc


@router.patch("/{location_id}", response_model=LocationOut)
async def update_location(location_id: int, data: LocationUpdate, db: AsyncSession = Depends(get_db)):
    loc = await db.get(Location, location_id)
    if not loc:
        raise HTTPException(404, "Location not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(loc, key, val)
    await db.commit()
    await db.refresh(loc)
    return loc


@router.delete("/{location_id}", status_code=204)
async def delete_location(location_id: int, db: AsyncSession = Depends(get_db)):
    loc = await db.get(Location, location_id)
    if not loc:
        raise HTTPException(404, "Location not found")
    await db.delete(loc)
    await db.commit()
