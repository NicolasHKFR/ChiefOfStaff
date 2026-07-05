from sqlalchemy import JSON, Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Worker(Base):
    __tablename__ = "worker"

    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(20), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    photo_url = Column(String(500), nullable=True)
    team_id = Column(Integer, ForeignKey("team.id"), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="Active")
    office_location = Column(String(255), nullable=True)
    custom_fields = Column(JSON, nullable=True)

    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class WorkerSkill(Base):
    __tablename__ = "worker_skill"

    worker_id = Column(Integer, ForeignKey("worker.id"), primary_key=True)
    skill_id = Column(Integer, ForeignKey("skill.id"), primary_key=True)
    proficiency_level = Column(String(30), nullable=True)
