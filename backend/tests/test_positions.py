"""Test /positions CRUD."""
import pytest


@pytest.mark.asyncio
async def test_list_positions(client, seed_db):
    resp = await client.get("/positions")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_get_position(client, seed_db):
    pos1 = seed_db["pos1"]
    resp = await client.get(f"/positions/{pos1.id}")
    assert resp.status_code == 200
    assert resp.json()["job_title"] == "Senior Engineer"


@pytest.mark.asyncio
async def test_get_position_not_found(client, seed_db):
    resp = await client.get("/positions/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_position_default_status(client, seed_db):
    resp = await client.post("/positions", json={"job_title": "New Role"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["job_title"] == "New Role"
    assert data["status"] == "Vacant"


@pytest.mark.asyncio
async def test_create_position_custom_status(client, seed_db):
    resp = await client.post("/positions", json={
        "job_title": "Planned Role",
        "status": "Planned",
    })
    assert resp.status_code == 201
    assert resp.json()["status"] == "Planned"


@pytest.mark.asyncio
async def test_create_position_missing_title(client, seed_db):
    resp = await client.post("/positions", json={})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_update_position(client, seed_db):
    pos1 = seed_db["pos1"]
    resp = await client.patch(f"/positions/{pos1.id}", json={"status": "Filled"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "Filled"


@pytest.mark.asyncio
async def test_update_position_not_found(client, seed_db):
    resp = await client.patch("/positions/99999", json={"status": "Filled"})
    assert resp.status_code == 404
