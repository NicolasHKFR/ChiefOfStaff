"""Test /quality-checks CRUD and Excel upload."""
from io import BytesIO

import openpyxl
import pytest


def _make_excel(sheets: dict[str, list[list]]) -> bytes:
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    for name, rows in sheets.items():
        ws = wb.create_sheet(name)
        for row in rows:
            ws.append(row)
    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_list_empty(client):
    resp = await client.get("/quality-checks")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_create(client):
    resp = await client.post("/quality-checks", json={"name": "July 2026 QC"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "July 2026 QC"
    assert data["status"] == "created"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_with_description(client):
    resp = await client.post("/quality-checks", json={
        "name": "Payroll QC", "description": "Check payroll against HR database",
    })
    assert resp.status_code == 201
    assert resp.json()["description"] == "Check payroll against HR database"


@pytest.mark.asyncio
async def test_create_missing_name(client):
    resp = await client.post("/quality-checks", json={})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_after_create(client):
    await client.post("/quality-checks", json={"name": "QC A"})
    await client.post("/quality-checks", json={"name": "QC B"})
    resp = await client.get("/quality-checks")
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_get_detail(client):
    create_resp = await client.post("/quality-checks", json={"name": "Detail QC"})
    qc_id = create_resp.json()["id"]
    resp = await client.get(f"/quality-checks/{qc_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Detail QC"
    assert data["files"] == []
    assert data["checks"] == []


@pytest.mark.asyncio
async def test_get_not_found(client):
    resp = await client.get("/quality-checks/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete(client):
    create_resp = await client.post("/quality-checks", json={"name": "To Delete"})
    qc_id = create_resp.json()["id"]
    resp = await client.delete(f"/quality-checks/{qc_id}")
    assert resp.status_code == 204
    get_resp = await client.get(f"/quality-checks/{qc_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_not_found(client):
    resp = await client.delete("/quality-checks/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_upload_excel(client):
    create_resp = await client.post("/quality-checks", json={"name": "Upload QC"})
    qc_id = create_resp.json()["id"]

    xlsx = _make_excel({
        "Employees": [
            ["Name", "Email", "Department"],
            ["Alice", "alice@test.com", "Engineering"],
            ["Bob", "bob@test.com", "Marketing"],
        ],
    })

    resp = await client.post(
        f"/quality-checks/{qc_id}/upload",
        files={"file": ("test.xlsx", xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["original_filename"] == "test.xlsx"
    assert data["row_count"] == 2
    assert data["quality_check_id"] == qc_id

    detail_resp = await client.get(f"/quality-checks/{qc_id}")
    detail = detail_resp.json()
    assert len(detail["files"]) == 1
    assert detail["status"] == "in_progress"


@pytest.mark.asyncio
async def test_upload_to_nonexistent_qc(client):
    xlsx = _make_excel({"Sheet1": [["A"], ["1"]]})
    resp = await client.post(
        "/quality-checks/99999/upload",
        files={"file": ("test.xlsx", xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_upload_non_excel(client):
    create_resp = await client.post("/quality-checks", json={"name": "Bad Upload QC"})
    qc_id = create_resp.json()["id"]
    resp = await client.post(
        f"/quality-checks/{qc_id}/upload",
        files={"file": ("bad.txt", b"not an excel", "text/plain")},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_delete_with_files_removes_them(client):
    create_resp = await client.post("/quality-checks", json={"name": "Delete with files"})
    qc_id = create_resp.json()["id"]

    xlsx = _make_excel({"Data": [["X"], ["1"], ["2"]]})
    await client.post(
        f"/quality-checks/{qc_id}/upload",
        files={"file": ("data.xlsx", xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )

    resp = await client.delete(f"/quality-checks/{qc_id}")
    assert resp.status_code == 204
