import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.document import Document
from app.schemas.common import DocumentOut

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    worker_id: int | None = None, db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).order_by(Document.uploaded_at.desc())
    if worker_id:
        stmt = stmt.where(Document.worker_id == worker_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=DocumentOut, status_code=201)
async def upload_document(
    worker_id: int,
    category: str,
    file: UploadFile,
    visibility_scope: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    ext = os.path.splitext(file.filename or "file")[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    os.makedirs(settings.upload_dir, exist_ok=True)
    filepath = os.path.join(settings.upload_dir, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    doc = Document(
        worker_id=worker_id,
        category=category,
        file_url=f"/uploads/{filename}",
        visibility_scope=visibility_scope,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


@router.delete("/{document_id}", status_code=204)
async def delete_document(document_id: int, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    filepath = os.path.join(settings.upload_dir, os.path.basename(doc.file_url))
    if os.path.exists(filepath):
        os.remove(filepath)
    await db.delete(doc)
    await db.commit()
