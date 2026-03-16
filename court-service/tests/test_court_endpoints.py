import pytest


COURT_DATA = {
    "name": "Center Court",
    "surface": "clay",
    "is_indoor": False,
    "hourly_rate": 25.0,
}


@pytest.mark.asyncio
async def test_create_court(client):
    response = await client.post("/courts/", json=COURT_DATA)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Center Court"
    assert data["surface"] == "clay"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_create_court_invalid_surface(client):
    invalid = {**COURT_DATA, "surface": "dirt"}
    response = await client.post("/courts/", json=invalid)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_courts(client):
    await client.post("/courts/", json=COURT_DATA)
    await client.post("/courts/", json={**COURT_DATA, "name": "Court 2", "surface": "grass"})

    response = await client.get("/courts/")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_get_court_by_id(client):
    create_response = await client.post("/courts/", json=COURT_DATA)
    court_id = create_response.json()["id"]

    response = await client.get(f"/courts/{court_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Center Court"


@pytest.mark.asyncio
async def test_get_court_not_found(client):
    response = await client.get("/courts/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_court(client):
    create_response = await client.post("/courts/", json=COURT_DATA)
    court_id = create_response.json()["id"]

    response = await client.put(f"/courts/{court_id}", json={"hourly_rate": 35.0})
    assert response.status_code == 200
    assert response.json()["hourly_rate"] == 35.0
    assert response.json()["name"] == "Center Court"


@pytest.mark.asyncio
async def test_update_court_not_found(client):
    response = await client.put(
        "/courts/00000000-0000-0000-0000-000000000000",
        json={"hourly_rate": 35.0},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_court(client):
    create_response = await client.post("/courts/", json=COURT_DATA)
    court_id = create_response.json()["id"]

    response = await client.delete(f"/courts/{court_id}")
    assert response.status_code == 204

    response = await client.get(f"/courts/{court_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_court_not_found(client):
    response = await client.delete("/courts/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
