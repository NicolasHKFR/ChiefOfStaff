from sqlalchemy import Column, Integer, String

from app.database import Base


class WorkerType(Base):
    __tablename__ = "worker_type"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
