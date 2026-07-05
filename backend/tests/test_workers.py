"""Test /workers CRUD endpoints."""
import pytest


@pytest.mark.asyncio
async def test_list_workers(client, seed_db):
    resp = await client.get("/workers")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 5


@pytest.mark.asyncio
async def test_list_workers_filter_status_terminated(client, seed_db):
    resp = await client.get("/workers?status=Terminated")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["status"] == "Terminated"


@pytest.mark.asyncio
async def test_list_workers_search(client, seed_db):
    resp = await client.get("/workers?q=charlie")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["email"] == "charlie@test.com"


@pytest.mark.asyncio
async def test_list_workers_search_by_email(client, seed_db):
    resp = await client.get("/workers?q=bob@test.com")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1


@pytest.mark.asyncio
async def test_list_workers_search_empty(client, seed_db):
    resp = await client.get("/workers?q=zzzznonexistent")
    assert resp.status_code == 200
    data = resp.json()
    assert data == []


@pytest.mark.asyncio
async def test_get_worker(client, seed_db):
    ic = seed_db["ic"]
    resp = await client.get(f"/workers/{ic.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["first_name"] == "Charlie"
    assert data["email"] == "charlie@test.com"


@pytest.mark.asyncio
async def test_get_worker_not_found(client, seed_db):
    resp = await client.get("/workers/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_worker(client, seed_db):
    payload = {
        "type": "Employee",
        "first_name": "New",
        "last_name": "Hire",
        "email": "new@test.com",
        "status": "Active",
    }
    resp = await client.post("/workers", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["first_name"] == "New"
    assert data["email"] == "new@test.com"
    assert data["status"] == "Active"


@pytest.mark.asyncio
async def test_create_worker_duplicate_email(client, seed_db):
    payload = {
        "type": "Employee",
        "first_name": "Dup",
        "last_name": "User",
        "email": "bob@test.com",
    }
    resp = await client.post("/workers", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_create_worker_missing_required(client, seed_db):
    resp = await client.post("/workers", json={"first_name": "NoType"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_worker_contractor(client, seed_db):
    payload = {
        "type": "Contractor",
        "first_name": "Ext",
        "last_name": "Worker",
        "email": "ext@test.com",
    }
    resp = await client.post("/workers", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "Contractor"


@pytest.mark.asyncio
async def test_update_worker_partial(client, seed_db):
    ic = seed_db["ic"]
    resp = await client.patch(f"/workers/{ic.id}", json={"first_name": "Charles"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["first_name"] == "Charles"
    assert data["email"] == "charlie@test.com"


@pytest.mark.asyncio
async def test_update_worker_dates(client, seed_db):
    ic = seed_db["ic"]
    resp = await client.patch(f"/workers/{ic.id}", json={
        "start_date": "2022-06-15",
        "end_date": "2027-12-31",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["start_date"] == "2022-06-15"
    assert data["end_date"] == "2027-12-31"


@pytest.mark.asyncio
async def test_update_worker_not_found(client, seed_db):
    resp = await client.patch("/workers/99999", json={"first_name": "Ghost"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_worker_team(client, seed_db):
    ic = seed_db["ic"]
    backend_t = seed_db["backend_t"]
    resp = await client.patch(f"/workers/{ic.id}", json={"team_id": backend_t.id})
    assert resp.status_code == 200
    data = resp.json()
    assert data["team_id"] == backend_t.id


@pytest.mark.asyncio
async def test_delete_worker(client, seed_db):
    contractor = seed_db["contractor"]
    resp = await client.delete(f"/workers/{contractor.id}")
    assert resp.status_code == 204

    list_resp = await client.get("/workers")
    assert len(list_resp.json()) == 4


@pytest.mark.asyncio
async def test_delete_worker_not_found(client, seed_db):
    resp = await client.delete("/workers/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_worker_clears_team_manager_refs(client, seed_db):
    mgr = seed_db["mgr"]
    frontend = seed_db["frontend"]
    resp = await client.delete(f"/workers/{mgr.id}")
    assert resp.status_code == 204

    get_resp = await client.get(f"/teams/{frontend.id}")
    assert get_resp.json()["manager_id"] is None


@pytest.mark.asyncio
async def test_delete_worker_removes_skills(client, seed_db, db):
    from app.models.worker import WorkerSkill
    from sqlalchemy import select

    ic = seed_db["ic"]
    resp = await client.delete(f"/workers/{ic.id}")
    assert resp.status_code == 204

    result = await db.execute(select(WorkerSkill).where(WorkerSkill.worker_id == ic.id))
    assert result.scalars().all() == []
