import pytest
from sqlalchemy import select

from court_service.models import Court


@pytest.mark.asyncio
async def test_create_court(db_session):
    court = Court(name="Court 1", surface="clay", is_indoor=False, hourly_rate=25.0)
    db_session.add(court)
    await db_session.commit()
    await db_session.refresh(court)

    assert court.id is not None
    assert court.name == "Court 1"
    assert court.surface == "clay"
    assert court.is_active is True


@pytest.mark.asyncio
async def test_get_court_by_id(db_session):
    court = Court(name="Court 2", surface="grass", is_indoor=True, hourly_rate=40.0)
    db_session.add(court)
    await db_session.commit()
    await db_session.refresh(court)

    fetched = await db_session.get(Court, court.id)
    assert fetched is not None
    assert fetched.name == "Court 2"
    assert fetched.is_indoor is True


@pytest.mark.asyncio
async def test_update_court(db_session):
    court = Court(name="Court 3", surface="hard", is_indoor=False, hourly_rate=30.0)
    db_session.add(court)
    await db_session.commit()

    court.hourly_rate = 35.0
    await db_session.commit()
    await db_session.refresh(court)

    assert court.hourly_rate == 35.0


@pytest.mark.asyncio
async def test_delete_court(db_session):
    court = Court(name="Court 4", surface="clay", is_indoor=False, hourly_rate=20.0)
    db_session.add(court)
    await db_session.commit()

    court_id = court.id
    await db_session.delete(court)
    await db_session.commit()

    result = await db_session.get(Court, court_id)
    assert result is None


@pytest.mark.asyncio
async def test_list_courts(db_session):
    db_session.add_all([
        Court(name="Court A", surface="clay", is_indoor=False, hourly_rate=20.0),
        Court(name="Court B", surface="grass", is_indoor=True, hourly_rate=30.0),
    ])
    await db_session.commit()

    result = await db_session.execute(select(Court))
    courts = result.scalars().all()
    assert len(courts) == 2
