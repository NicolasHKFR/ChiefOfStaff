"""Test /documents CRUD."""
import io
import pytest


@pytest.mark.asyncio
async def test_list_documents_empty(client, seed_db):
    resp = await client.get("/documents")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_upload_document(client, seed_db):
    ic = seed_db["ic"]
    file_content = b"Hello, this is a test document"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    resp = await client.post(
        f"/documents?worker_id={ic.id}&category=Contract",
        files=files,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["worker_id"] == ic.id
    assert data["category"] == "Contract"
    assert data["file_url"].endswith(".txt")


@pytest.mark.asyncio
async def test_upload_document_then_list(client, seed_db):
    ic = seed_db["ic"]
    files = {"file": ("doc.pdf", io.BytesIO(b"pdf content"), "application/pdf")}
    await client.post(f"/documents?worker_id={ic.id}&category=NDA", files=files)
    resp = await client.get(f"/documents?worker_id={ic.id}")
    data = resp.json()
    assert len(data) == 1
    assert data[0]["category"] == "NDA"


@pytest.mark.asyncio
async def test_delete_document(client, seed_db):
    ic = seed_db["ic"]
    files = {"file": ("delete_me.txt", io.BytesIO(b"delete me"), "text/plain")}
    created = await client.post(f"/documents?worker_id={ic.id}&category=Other", files=files)
    doc_id = created.json()["id"]
    resp = await client.delete(f"/documents/{doc_id}")
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_document_not_found(client, seed_db):
    resp = await client.delete("/documents/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_documents_filter_by_worker(client, seed_db):
    ic = seed_db["ic"]
    mgr = seed_db["mgr"]
    files = {"file": ("ic.txt", io.BytesIO(b"ic doc"), "text/plain")}
    await client.post(f"/documents?worker_id={ic.id}&category=Contract", files=files)
    files2 = {"file": ("mgr.txt", io.BytesIO(b"mgr doc"), "text/plain")}
    await client.post(f"/documents?worker_id={mgr.id}&category=Contract", files=files2)
    resp = await client.get(f"/documents?worker_id={ic.id}")
    assert len(resp.json()) == 1
    assert resp.json()[0]["worker_id"] == ic.id
