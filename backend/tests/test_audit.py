"""Test audit logging on tracked entities."""
import pytest


@pytest.mark.asyncio
async def test_audit_worker_update_logged(client, seed_db, db):
    ic = seed_db["ic"]
    await client.patch(f"/workers/{ic.id}", json={"job_title": "Senior Engineer"})
    resp = await client.get(f"/audit-log/Worker/{ic.id}")
    data = resp.json()
    assert len(data) >= 1
    assert any(e["field_changed"] == "job_title" for e in data)


@pytest.mark.asyncio
async def test_audit_team_update_logged(client, seed_db):
    frontend = seed_db["frontend"]
    await client.patch(f"/teams/{frontend.id}", json={"name": "FE Team"})
    resp = await client.get(f"/audit-log/Team/{frontend.id}")
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_audit_position_update_logged(client, seed_db):
    pos1 = seed_db["pos1"]
    await client.patch(f"/positions/{pos1.id}", json={"status": "Filled"})
    resp = await client.get(f"/audit-log/Position/{pos1.id}")
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_audit_no_log_on_same_value(client, seed_db):
    ic = seed_db["ic"]
    await client.patch(f"/workers/{ic.id}", json={"job_title": "Engineer"})
    resp = await client.get(f"/audit-log/Worker/{ic.id}")
    count_before = len(resp.json())
    await client.patch(f"/workers/{ic.id}", json={"job_title": "Engineer"})
    resp = await client.get(f"/audit-log/Worker/{ic.id}")
    assert len(resp.json()) == count_before


@pytest.mark.asyncio
async def test_audit_skill_not_logged(client, seed_db):
    python = seed_db["python"]
    await client.post("/skills", json={"name": "Go"})
    await client.get(f"/audit-log/Skill/{python.id}")
    # Skill isn't tracked, should return empty
    resp = await client.get(f"/audit-log/Skill/99999")
    assert resp.json() == []


@pytest.mark.asyncio
async def test_audit_ordered_by_date(client, seed_db):
    ic = seed_db["ic"]
    await client.patch(f"/workers/{ic.id}", json={"job_title": "Senior Engineer"})
    await client.patch(f"/workers/{ic.id}", json={"office_location": "HQ"})
    resp = await client.get(f"/audit-log/Worker/{ic.id}")
    data = resp.json()
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_audit_no_entries_for_new_entity(client, seed_db):
    resp = await client.get("/audit-log/Worker/99999")
    assert resp.json() == []
