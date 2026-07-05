"""Test /reports endpoints."""
import pytest


@pytest.mark.asyncio
async def test_headcount_report(client, seed_db):
    resp = await client.get("/reports/headcount")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 4
    assert len(data["by_type"]) > 0
    assert len(data["by_department"]) > 0


@pytest.mark.asyncio
async def test_headcount_excludes_terminated(client, seed_db):
    resp = await client.get("/reports/headcount")
    data = resp.json()
    assert data["total"] == 4


@pytest.mark.asyncio
async def test_salary_report(client, seed_db):
    resp = await client.get("/reports/salary")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    for dept in data:
        assert dept["avg_salary"] > 0
        assert dept["total_salary"] > 0


@pytest.mark.asyncio
async def test_leave_stats(client, seed_db):
    resp = await client.get("/reports/leave-stats")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    for stat in data:
        assert "leave_type" in stat
        assert "status" in stat
        assert "count" in stat


@pytest.mark.asyncio
async def test_reports_empty_db(client):
    for path in ["/reports/headcount", "/reports/salary", "/reports/leave-stats"]:
        resp = await client.get(path)
        assert resp.status_code == 200
