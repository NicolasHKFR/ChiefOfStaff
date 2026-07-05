"""Test /leave-requests CRUD + approval workflow."""
import pytest


@pytest.mark.asyncio
async def test_list_leave_types(client, seed_db):
    resp = await client.get("/leave-requests/types")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    names = [t["name"] for t in data]
    assert "Annual Leave" in names
    assert "Sick Leave" in names


@pytest.mark.asyncio
async def test_list_leave_requests(client, seed_db):
    resp = await client.get("/leave-requests")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_list_leave_requests_filter_worker(client, seed_db):
    ic = seed_db["ic"]
    resp = await client.get(f"/leave-requests?worker_id={ic.id}")
    data = resp.json()
    assert len(data) == 1
    assert data[0]["worker_id"] == ic.id


@pytest.mark.asyncio
async def test_create_leave_request(client, seed_db):
    ic = seed_db["ic"]
    annual = seed_db["annual"]
    resp = await client.post("/leave-requests", json={
        "worker_id": ic.id,
        "leave_type_id": annual.id,
        "start_date": "2026-08-01",
        "end_date": "2026-08-05",
        "comment": "Family event",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "Pending"
    assert data["comment"] == "Family event"


@pytest.mark.asyncio
async def test_create_leave_request_invalid_type(client, seed_db):
    ic = seed_db["ic"]
    resp = await client.post("/leave-requests", json={
        "worker_id": ic.id,
        "leave_type_id": 99999,
        "start_date": "2026-08-01",
        "end_date": "2026-08-05",
    })
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_approve_leave(client, seed_db):
    lr1 = seed_db["lr1"]
    ceo = seed_db["ceo"]
    resp = await client.patch(f"/leave-requests/{lr1.id}?status=Approved&approver_id={ceo.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "Approved"
    assert data["approver_id"] == ceo.id
    assert data["decided_at"] is not None


@pytest.mark.asyncio
async def test_reject_leave(client, seed_db):
    ic = seed_db["ic"]
    ceo = seed_db["ceo"]
    annual = seed_db["annual"]
    created = await client.post("/leave-requests", json={
        "worker_id": ic.id, "leave_type_id": annual.id,
        "start_date": "2026-09-01", "end_date": "2026-09-01",
    })
    lr_id = created.json()["id"]
    resp = await client.patch(f"/leave-requests/{lr_id}?status=Rejected&approver_id={ceo.id}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "Rejected"


@pytest.mark.asyncio
async def test_update_leave_invalid_status(client, seed_db):
    lr1 = seed_db["lr1"]
    resp = await client.patch(f"/leave-requests/{lr1.id}?status=InvalidStatus&approver_id=1")
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_update_leave_not_found(client, seed_db):
    resp = await client.patch("/leave-requests/99999?status=Approved&approver_id=1")
    assert resp.status_code == 404
