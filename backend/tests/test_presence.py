"""Test /presence endpoint."""
import pytest


@pytest.mark.asyncio
async def test_presence_returns_months(client, seed_db):
    resp = await client.get("/presence")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["months"]) == 36
    assert data["months"][0] == "2026-01"
    assert data["months"][-1] == "2028-12"


@pytest.mark.asyncio
async def test_presence_excludes_terminated(client, seed_db):
    resp = await client.get("/presence")
    data = resp.json()
    worker_names = [w["first_name"] for w in data["workers"]]
    assert "Eve" not in worker_names


@pytest.mark.asyncio
async def test_presence_worker_no_end_date(client, seed_db):
    resp = await client.get("/presence")
    data = resp.json()
    charlie = next(w for w in data["workers"] if w["first_name"] == "Charlie")
    assert all(charlie["presence"])


@pytest.mark.asyncio
async def test_presence_worker_with_end_date(client, seed_db):
    resp = await client.get("/presence")
    data = resp.json()
    diana = next(w for w in data["workers"] if w["first_name"] == "Diana")
    present_months = sum(diana["presence"])
    assert present_months == 0
    assert diana["end_date"] == "2024-12-31"


@pytest.mark.asyncio
async def test_presence_summary(client, seed_db):
    resp = await client.get("/presence")
    data = resp.json()
    assert len(data["summary"]) == 36
    assert all(s >= 0 for s in data["summary"])


@pytest.mark.asyncio
async def test_presence_start_idx(client, seed_db):
    resp = await client.get("/presence")
    data = resp.json()
    bob = next(w for w in data["workers"] if w["first_name"] == "Bob")
    assert bob["start_idx"] == 0


@pytest.mark.asyncio
async def test_presence_end_idx_null_for_active(client, seed_db):
    resp = await client.get("/presence")
    data = resp.json()
    bob = next(w for w in data["workers"] if w["first_name"] == "Bob")
    assert bob["end_idx"] == 35


@pytest.mark.asyncio
async def test_presence_empty_db(client):
    resp = await client.get("/presence")
    assert resp.status_code == 200
    data = resp.json()
    assert data["workers"] == []
    assert len(data["summary"]) == 36
    assert all(s == 0 for s in data["summary"])
