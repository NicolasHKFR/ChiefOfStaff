"""Test /teams CRUD."""
import pytest


@pytest.mark.asyncio
async def test_list_teams(client, seed_db):
    resp = await client.get("/teams")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 3


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
    resp = await client.post("/teams", json={"name": "QA"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "QA"


@pytest.mark.asyncio
async def test_create_team_missing_name(client, seed_db):
    resp = await client.post("/teams", json={})
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


@pytest.mark.asyncio
async def test_team_has_manager(client, seed_db):
    frontend = seed_db["frontend"]
    mgr = seed_db["mgr"]
    resp = await client.get(f"/teams/{frontend.id}")
    assert resp.json()["manager_id"] == mgr.id


@pytest.mark.asyncio
async def test_team_no_manager(client, seed_db):
    backend_t = seed_db["backend_t"]
    resp = await client.get(f"/teams/{backend_t.id}")
    assert resp.json()["manager_id"] is None


@pytest.mark.asyncio
async def test_team_update_manager(client, seed_db):
    backend_t = seed_db["backend_t"]
    mgr = seed_db["mgr"]
    resp = await client.patch(f"/teams/{backend_t.id}", json={"manager_id": mgr.id})
    assert resp.status_code == 200
    assert resp.json()["manager_id"] == mgr.id


@pytest.mark.asyncio
async def test_cannot_update_root_team(client, seed_db):
    root = seed_db["root"]
    resp = await client.patch(f"/teams/{root.id}", json={"name": "Renamed"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_cannot_delete_root_team(client, seed_db):
    root = seed_db["root"]
    resp = await client.delete(f"/teams/{root.id}")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_can_delete_non_root_team(client, seed_db):
    backend_t = seed_db["backend_t"]
    resp = await client.delete(f"/teams/{backend_t.id}")
    assert resp.status_code == 204
    get_resp = await client.get(f"/teams/{backend_t.id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_team_nullifies_worker_team(client, seed_db):
    frontend = seed_db["frontend"]
    ic = seed_db["ic"]
    resp = await client.delete(f"/teams/{frontend.id}")
    assert resp.status_code == 204
    get_resp = await client.get(f"/workers/{ic.id}")
    assert get_resp.json()["team_id"] is None
