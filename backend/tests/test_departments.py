"""Test /departments CRUD."""
import pytest


@pytest.mark.asyncio
async def test_list_departments(client, seed_db):
    resp = await client.get("/departments")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    names = [d["name"] for d in data]
    assert "Engineering" in names
    assert "HR" in names


@pytest.mark.asyncio
async def test_get_department(client, seed_db):
    eng = seed_db["eng"]
    resp = await client.get(f"/departments/{eng.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Engineering"


@pytest.mark.asyncio
async def test_get_department_not_found(client, seed_db):
    resp = await client.get("/departments/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_department(client, seed_db):
    org = seed_db["org"]
    resp = await client.post("/departments", json={
        "organization_id": org.id,
        "name": "Marketing",
    })
    assert resp.status_code == 201
    assert resp.json()["name"] == "Marketing"


@pytest.mark.asyncio
async def test_create_department_missing_name(client, seed_db):
    resp = await client.post("/departments", json={"organization_id": 1})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_update_department(client, seed_db):
    eng = seed_db["eng"]
    resp = await client.patch(f"/departments/{eng.id}", json={"name": "Engineering Dept"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Engineering Dept"


@pytest.mark.asyncio
async def test_update_department_not_found(client, seed_db):
    resp = await client.patch("/departments/99999", json={"name": "Ghost"})
    assert resp.status_code == 404
