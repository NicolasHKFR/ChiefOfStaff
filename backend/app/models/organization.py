from sqlalchemy import Column, Integer, String, JSON

from app.database import Base


class Organization(Base):
    __tablename__ = "organization"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    settings = Column(JSON, nullable=False, default=dict)
