from sqlalchemy import Column, ForeignKey, Integer, String

from app.database import Base


class Team(Base):
    __tablename__ = "team"

    id = Column(Integer, primary_key=True, autoincrement=True)
    department_id = Column(Integer, ForeignKey("department.id"), nullable=False)
    name = Column(String(255), nullable=False)
