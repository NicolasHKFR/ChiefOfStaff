from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func

from app.database import Base


class Document(Base):
    __tablename__ = "document"

    id = Column(Integer, primary_key=True, autoincrement=True)
    worker_id = Column(Integer, ForeignKey("worker.id"), nullable=False)
    category = Column(String(50), nullable=False)
    file_url = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    visibility_scope = Column(String(50), nullable=True)
