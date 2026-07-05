"""Test /skills CRUD."""
import pytest


@pytest.mark.asyncio
async def test_list_skills(client, seed_db):
    resp = await client.get("/skills")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 3


@pytest.mark.asyncio
async def test_list_skills_search(client, seed_db):
    resp = await client.get("/skills?q=python")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "Python"


@pytest.mark.asyncio
async def test_list_skills_search_case_insensitive(client, seed_db):
    resp = await client.get("/skills?q=PYTHON")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


@pytest.mark.asyncio
async def test_list_skills_search_no_match(client, seed_db):
    resp = await client.get("/skills?q=zzzznonexistent")
    assert resp.json() == []


@pytest.mark.asyncio
async def test_create_skill(client, seed_db):
    resp = await client.post("/skills", json={"name": "Go", "category": "Backend"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "Go"


@pytest.mark.asyncio
async def test_create_skill_missing_name(client, seed_db):
    resp = await client.post("/skills", json={})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_skill_duplicate(client, seed_db):
    resp = await client.post("/skills", json={"name": "Python"})
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_get_skill(client, seed_db):
    python = seed_db["python"]
    resp = await client.get(f"/skills/{python.id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Python"


@pytest.mark.asyncio
async def test_get_skill_not_found(client, seed_db):
    resp = await client.get("/skills/99999")
    assert resp.status_code == 404
