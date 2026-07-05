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

    def find_name(node, name):
        if node["first_name"] == name:
            return True
        return any(find_name(c, name) for c in node.get("children", []))

    assert not find_name(data, "Charlie")


@pytest.mark.asyncio
async def test_leave_approve_then_list(client, seed_db):
    lr1 = seed_db["lr1"]
    ceo = seed_db["ceo"]
    assert lr1.status == "Pending"

    await client.patch(f"/leave-requests/{lr1.id}?status=Approved&approver_id={ceo.id}")

    resp = await client.get("/leave-requests")
    data = resp.json()
    approved = [r for r in data if r["id"] == lr1.id]
    assert len(approved) == 1
    assert approved[0]["status"] == "Approved"


@pytest.mark.asyncio
async def test_export_reflects_updated_worker(client, seed_db):
    ic = seed_db["ic"]
    await client.patch(f"/workers/{ic.id}", json={"job_title": "Senior Engineer"})
    resp = await client.get("/export/workers?format=csv")
    assert "Senior Engineer" in resp.text


@pytest.mark.asyncio
async def test_create_department_then_create_team(client, seed_db):
    org = seed_db["org"]
    dept_resp = await client.post("/departments", json={
        "organization_id": org.id, "name": "New Dept",
    })
    dept_id = dept_resp.json()["id"]
    team_resp = await client.post("/teams", json={
        "department_id": dept_id, "name": "New Team",
    })
    assert team_resp.status_code == 201
    assert team_resp.json()["department_id"] == dept_id


@pytest.mark.asyncio
async def test_search_across_types(client, seed_db):
    resp = await client.get("/search?q=bob")
    data = resp.json()
    assert len(data["workers"]) >= 1
