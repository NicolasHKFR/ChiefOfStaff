"""Test seed data generates correct row counts."""
import pytest


@pytest.mark.asyncio
async def test_seed_creates_organization(client, seed_db):
    org = seed_db["org"]
    assert org.name == "TestCorp"


@pytest.mark.asyncio
async def test_seed_worker_counts(client, seed_db):
    resp = await client.get("/workers")
    assert len(resp.json()) == 6


@pytest.mark.asyncio
async def test_seed_department_count(client, seed_db):
    resp = await client.get("/departments")
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_seed_team_count(client, seed_db):
    resp = await client.get("/teams")
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_seed_skill_count(client, seed_db):
    resp = await client.get("/skills")
    assert len(resp.json()) == 3


@pytest.mark.asyncio
async def test_seed_position_count(client, seed_db):
    resp = await client.get("/positions")
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_seed_leave_type_count(client, seed_db):
    resp = await client.get("/leave-requests/types")
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_seed_leave_request_count(client, seed_db):
    resp = await client.get("/leave-requests")
    assert len(resp.json()) == 2
