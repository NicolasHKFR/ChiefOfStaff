"""Test /export endpoint."""
import pytest


@pytest.mark.asyncio
async def test_export_csv(client, seed_db):
    resp = await client.get("/export/workers?format=csv")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert "workers.csv" in resp.headers["content-disposition"]
    body = resp.text
    assert "ID" in body
    assert "Charlie" in body
    assert "Bob" in body


@pytest.mark.asyncio
async def test_export_xlsx(client, seed_db):
    resp = await client.get("/export/workers?format=xlsx")
    assert resp.status_code == 200
    assert "spreadsheetml" in resp.headers["content-type"]
    assert resp.content


@pytest.mark.asyncio
async def test_export_invalid_format(client, seed_db):
    resp = await client.get("/export/workers?format=pdf")
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_export_excludes_terminated(client, seed_db):
    resp = await client.get("/export/workers?format=csv")
    body = resp.text
    assert "Eve" not in body


@pytest.mark.asyncio
async def test_export_empty(client):
    resp = await client.get("/export/workers?format=csv")
    assert resp.status_code == 200
    assert "ID" in resp.text
