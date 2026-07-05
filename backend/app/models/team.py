from sqlalchemy import Column, ForeignKey, Integer, String

from app.database import Base


class Team(Base):
    __tablename__ = "team"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    manager_id = Column(Integer, ForeignKey("worker.id"), nullable=True)
    parent_team_id = Column(Integer, ForeignKey("team.id"), nullable=True)
