from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class QualityCheck(Base):
    __tablename__ = "quality_check"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False, default="created")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    files = relationship("QCFile", back_populates="quality_check", cascade="all, delete-orphan")
    checks = relationship("QCCheck", back_populates="quality_check", cascade="all, delete-orphan")


class QCFile(Base):
    __tablename__ = "qc_file"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quality_check_id = Column(Integer, ForeignKey("quality_check.id"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_path = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    data_json = Column(JSON, nullable=True)
    row_count = Column(Integer, nullable=True)

    quality_check = relationship("QualityCheck", back_populates="files")


class QCCheck(Base):
    __tablename__ = "qc_check"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quality_check_id = Column(Integer, ForeignKey("quality_check.id"), nullable=False)
    check_type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    summary = Column(String(500), nullable=True)
    details_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quality_check = relationship("QualityCheck", back_populates="checks")
