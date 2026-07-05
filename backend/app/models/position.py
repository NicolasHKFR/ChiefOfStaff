from sqlalchemy import Column, Date, ForeignKey, Integer, String

from app.database import Base


class Position(Base):
    __tablename__ = "position"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_title = Column(String(255), nullable=False)
    team_id = Column(Integer, ForeignKey("team.id"), nullable=True)
    employment_type = Column(String(50), nullable=True)
    status = Column(String(20), nullable=False, default="Vacant")
    target_start_date = Column(Date, nullable=True)
    linked_worker_id = Column(Integer, ForeignKey("worker.id"), nullable=True)
