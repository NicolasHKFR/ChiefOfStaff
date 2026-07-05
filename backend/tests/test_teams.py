"""Test /teams CRUD."""
import pytest


@pytest.mark.asyncio
async def test_list_teams(client, seed_db):
    resp = await client.get("/teams")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_list_teams_filter_department(client, seed_db):
    eng = seed_db["eng"]
    hr = seed_db["hr"]
    resp_eng = await client.get(f"/teams?department_id={eng.id}")
    assert len(resp_eng.json()) == 2
    resp_hr = await client.get(f"/teams?department_id={hr.id}")
    assert resp_hr.json() == []


@pytest.mark.asyncio
async def test_get_team(client, seed_db):
    frontend = seed_db["frontend"]
    resp = await client.get(f"/teams/{frontend.id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Frontend"


@pytest.mark.asyncio
async def test_get_team_not_found(client, seed_db):
    resp = await client.get("/teams/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_team(client, seed_db):
    eng = seed_db["eng"]
    resp = await client.post("/teams", json={
        "department_id": eng.id,
        "name": "QA",
    })
    assert resp.status_code == 201
    assert resp.json()["name"] == "QA"


@pytest.mark.asyncio
async def test_create_team_missing_name(client, seed_db):
    resp = await client.post("/teams", json={"department_id": 1})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_update_team(client, seed_db):
    frontend = seed_db["frontend"]
    resp = await client.patch(f"/teams/{frontend.id}", json={"name": "Frontend Team"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Frontend Team"


@pytest.mark.asyncio
async def test_update_team_not_found(client, seed_db):
    resp = await client.patch("/teams/99999", json={"name": "Ghost"})
    assert resp.status_code == 404
