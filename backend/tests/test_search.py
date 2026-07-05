"""Test /search endpoint."""
import pytest


@pytest.mark.asyncio
async def test_search_finds_workers(client, seed_db):
    resp = await client.get("/search?q=charlie")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["workers"]) >= 1
    assert any("Charlie" in w["label"] for w in data["workers"])


@pytest.mark.asyncio
async def test_search_finds_teams(client, seed_db):
    resp = await client.get("/search?q=frontend")
    data = resp.json()
    assert len(data["teams"]) >= 1


@pytest.mark.asyncio
async def test_search_finds_positions(client, seed_db):
    resp = await client.get("/search?q=engineer")
    data = resp.json()
    assert len(data["positions"]) >= 1


@pytest.mark.asyncio
async def test_search_no_results(client, seed_db):
    resp = await client.get("/search?q=zzzznonexistent")
    data = resp.json()
    assert all(len(v) == 0 for v in data.values())


@pytest.mark.asyncio
async def test_search_empty_query(client, seed_db):
    resp = await client.get("/search")
    assert resp.status_code == 422
