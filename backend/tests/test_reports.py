"""Test /reports endpoints."""
import pytest


@pytest.mark.asyncio
async def test_headcount_report(client, seed_db):
    resp = await client.get("/reports/headcount")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 4
    assert len(data["by_type"]) > 0
    assert len(data["by_team"]) > 0


@pytest.mark.asyncio
async def test_headcount_excludes_terminated(client, seed_db):
    resp = await client.get("/reports/headcount")
    data = resp.json()
    assert data["total"] == 4


@pytest.mark.asyncio
async def test_reports_empty_db(client):
    resp = await client.get("/reports/headcount")
    assert resp.status_code == 200
