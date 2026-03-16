import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from court_service.database import get_db
from court_service.models import Court
from court_service.schemas import CourtCreate, CourtUpdate, CourtResponse

logger = logging.getLogger("court_service.controller")

router = APIRouter(prefix="/courts", tags=["courts"])


@router.get("/", response_model=list[CourtResponse])
async def get_courts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Court))
    courts = result.scalars().all()
    logger.info("Fetched %d courts", len(courts))
    return courts


@router.get("/{court_id}", response_model=CourtResponse)
async def get_court(court_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    court = await db.get(Court, court_id)
    if not court:
        logger.warning("Court %s not found", court_id)
        raise HTTPException(status_code=404, detail="Court not found")
    logger.info("Fetched court %s", court_id)
    return court


@router.post("/", response_model=CourtResponse, status_code=201)
async def create_court(body: CourtCreate, db: AsyncSession = Depends(get_db)):
    court = Court(**body.model_dump())
    db.add(court)
    await db.commit()
    await db.refresh(court)
    logger.info("Created court %s (%s)", court.id, court.name)
    return court


@router.put("/{court_id}", response_model=CourtResponse)
async def update_court(
    court_id: uuid.UUID, body: CourtUpdate, db: AsyncSession = Depends(get_db)
):
    court = await db.get(Court, court_id)
    if not court:
        logger.warning("Court %s not found for update", court_id)
        raise HTTPException(status_code=404, detail="Court not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(court, field, value)

    await db.commit()
    await db.refresh(court)
    logger.info("Updated court %s", court_id)
    return court


@router.delete("/{court_id}", status_code=204)
async def delete_court(court_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    court = await db.get(Court, court_id)
    if not court:
        logger.warning("Court %s not found for deletion", court_id)
        raise HTTPException(status_code=404, detail="Court not found")
    await db.delete(court)
    await db.commit()
    logger.info("Deleted court %s", court_id)
