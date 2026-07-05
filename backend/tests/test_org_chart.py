"""Test /org-chart endpoint."""
import pytest


def _find_team(nodes, name):
    for node in nodes:
        if node["name"] == name:
            return node
        found = _find_team(node.get("children", []), name)
        if found:
            return found
    return None


def _find_worker_in_team(node, name):
    for m in node.get("members", []):
        if m["first_name"] == name:
            return True
    return any(
        _find_worker_in_team(c, name)
        for c in node.get("children", [])
    )


@pytest.mark.asyncio
async def test_org_chart_returns_teams(client, seed_db):
    resp = await client.get("/org-chart")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0


@pytest.mark.asyncio
async def test_org_chart_team_has_members(client, seed_db):
    resp = await client.get("/org-chart")
    data = resp.json()
    frontend = _find_team(data, "Frontend")
    assert frontend is not None
    assert len(frontend["members"]) >= 1


@pytest.mark.asyncio
async def test_org_chart_team_has_manager(client, seed_db):
    resp = await client.get("/org-chart")
    data = resp.json()
    frontend = _find_team(data, "Frontend")
    assert frontend is not None
    assert frontend["manager"] is not None


@pytest.mark.asyncio
async def test_org_chart_excludes_terminated(client, seed_db):
    resp = await client.get("/org-chart")
    data = resp.json()
    assert not _find_worker_in_team({"children": data, "members": []}, "Eve")


@pytest.mark.asyncio
async def test_org_chart_empty_db(client):
    resp = await client.get("/org-chart")
    assert resp.status_code == 200
    data = resp.json()
    assert data == []


@pytest.mark.asyncio
async def test_org_chart_worker_in_team(client, seed_db):
    resp = await client.get("/org-chart")
    data = resp.json()
    assert _find_worker_in_team({"children": data, "members": []}, "Charlie")
