"""Test /org-chart endpoint."""
import pytest


@pytest.mark.asyncio
async def test_org_chart_single_root(client, seed_db):
    resp = await client.get("/org-chart")
    assert resp.status_code == 200
    data = resp.json()
    assert data["first_name"] == "Alice"
    assert len(data["children"]) > 0


@pytest.mark.asyncio
async def test_org_chart_hierarchy(client, seed_db):
    resp = await client.get("/org-chart")
    data = resp.json()
    bob = next(c for c in data["children"] if c["first_name"] == "Bob")
    assert len(bob["children"]) >= 2


@pytest.mark.asyncio
async def test_org_chart_excludes_terminated(client, seed_db):
    resp = await client.get("/org-chart")
    data = resp.json()

    def find_name(node, name):
        if node["first_name"] == name:
            return True
        return any(find_name(c, name) for c in node["children"])

    assert not find_name(data, "Eve")


@pytest.mark.asyncio
async def test_org_chart_no_terminated_in_subtree(client, seed_db):
    """Verify terminated workers aren't in the tree at any depth."""
    resp = await client.get("/org-chart")
    data = resp.json()

    all_names = []

    def collect(node):
        all_names.append(node["first_name"])
        for c in node.get("children", []):
            collect(c)

    collect(data)
    assert "Eve" not in all_names


@pytest.mark.asyncio
async def test_org_chart_empty_db(client):
    resp = await client.get("/org-chart")
    assert resp.status_code == 200
    data = resp.json()
    assert data == []
