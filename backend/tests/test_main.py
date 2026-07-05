"""Test edge cases and cross-entity interactions."""
import pytest


@pytest.mark.asyncio
async def test_create_worker_then_appears_in_directory(client, seed_db):
    resp = await client.post("/workers", json={
        "type": "Employee", "first_name": "New", "last_name": "Hire",
        "email": "newhire@test.com",
    })
    assert resp.status_code == 201
    new_id = resp.json()["id"]
    resp2 = await client.get(f"/workers/{new_id}")
    assert resp2.status_code == 200


@pytest.mark.asyncio
async def test_terminate_worker_removes_from_presence(client, seed_db):
    ic = seed_db["ic"]
    resp_before = await client.get("/presence")
    count_before = len(resp_before.json()["workers"])

    await client.patch(f"/workers/{ic.id}", json={"status": "Terminated"})

    resp_after = await client.get("/presence")
    count_after = len(resp_after.json()["workers"])
    assert count_after == count_before - 1


@pytest.mark.asyncio
async def test_terminate_worker_removes_from_org_chart(client, seed_db):
    ic = seed_db["ic"]
    await client.patch(f"/workers/{ic.id}", json={"status": "Terminated"})

    resp = await client.get("/org-chart")
    data = resp.json()

    def find_worker(nodes, name):
        for node in nodes:
            for m in node.get("members", []):
                if m["first_name"] == name:
                    return True
            if find_worker(node.get("children", []), name):
                return True
        return False

    assert not find_worker(data if isinstance(data, list) else [data], "Charlie")


@pytest.mark.asyncio
async def test_export_reflects_updated_worker(client, seed_db):
    ic = seed_db["ic"]
    await client.patch(f"/workers/{ic.id}", json={"first_name": "Charles"})
    resp = await client.get("/export/workers?format=csv")
    assert "Charles" in resp.text


@pytest.mark.asyncio
async def test_create_team_then_assign_member(client, seed_db):
    resp = await client.post("/teams", json={"name": "New Team"})
    team_id = resp.json()["id"]
    ic = seed_db["ic"]
    await client.patch(f"/workers/{ic.id}", json={"team_id": team_id})
    get_resp = await client.get(f"/workers/{ic.id}")
    assert get_resp.json()["team_id"] == team_id


@pytest.mark.asyncio
async def test_search_across_types(client, seed_db):
    resp = await client.get("/search?q=bob")
    data = resp.json()
    assert len(data["workers"]) >= 1


@pytest.mark.asyncio
async def test_org_chart_returns_teams(client, seed_db):
    resp = await client.get("/org-chart")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "Root"
    child_names = [c["name"] for c in data[0].get("children", [])]
    assert "Frontend" in child_names
