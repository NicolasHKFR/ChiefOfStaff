"""Test /locations CRUD."""
import pytest


@pytest.mark.asyncio
async def test_list_empty(client):
    resp = await client.get("/locations")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_create(client):
    resp = await client.post("/locations", json={"name": "Headquarters"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Headquarters"
    assert data["address"] is None
    assert "id" in data


@pytest.mark.asyncio
async def test_create_with_address(client):
    resp = await client.post("/locations", json={"name": "Branch Office", "address": "123 Main St"})
    assert resp.status_code == 201
    assert resp.json()["address"] == "123 Main St"


@pytest.mark.asyncio
async def test_create_duplicate(client):
    await client.post("/locations", json={"name": "HQ"})
    resp = await client.post("/locations", json={"name": "HQ"})
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_create_missing_name(client):
    resp = await client.post("/locations", json={})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list(client):
    await client.post("/locations", json={"name": "A"})
    await client.post("/locations", json={"name": "B"})
    resp = await client.get("/locations")
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_update(client):
    create_resp = await client.post("/locations", json={"name": "Old Name"})
    loc_id = create_resp.json()["id"]
    resp = await client.patch(f"/locations/{loc_id}", json={"name": "New Name"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_update_not_found(client):
    resp = await client.patch("/locations/99999", json={"name": "Ghost"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete(client):
    create_resp = await client.post("/locations", json={"name": "To Delete"})
    loc_id = create_resp.json()["id"]
    resp = await client.delete(f"/locations/{loc_id}")
    assert resp.status_code == 204
    get_resp = await client.get("/locations")
    assert len(get_resp.json()) == 0


@pytest.mark.asyncio
async def test_delete_not_found(client):
    resp = await client.delete("/locations/99999")
    assert resp.status_code == 404
