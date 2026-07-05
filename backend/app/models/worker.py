from sqlalchemy import JSON, Column, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class Worker(Base):
    __tablename__ = "worker"

    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(20), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    photo_url = Column(String(500), nullable=True)
    email = Column(String(255), nullable=True, unique=True)
    phone = Column(String(50), nullable=True)
    job_title = Column(String(255), nullable=True)
    department_id = Column(Integer, ForeignKey("department.id"), nullable=True)
    team_id = Column(Integer, ForeignKey("team.id"), nullable=True)
    manager_id = Column(Integer, ForeignKey("worker.id"), nullable=True)
    employment_type = Column(String(50), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="Active")
    office_location = Column(String(255), nullable=True)
    supplier_agency_name = Column(String(255), nullable=True)
    contract_end_date = Column(Date, nullable=True)
    rate_type = Column(String(20), nullable=True)
    rate_amount = Column(Numeric(12, 2), nullable=True)
    annual_salary = Column(Numeric(12, 2), nullable=True)
    daily_rate = Column(Numeric(12, 2), nullable=True)
    hourly_rate = Column(Numeric(12, 2), nullable=True)
    custom_fields = Column(JSON, nullable=True)

    manager = relationship("Worker", remote_side=[id], backref="direct_reports")

    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class WorkerSkill(Base):
    __tablename__ = "worker_skill"

    worker_id = Column(Integer, ForeignKey("worker.id"), primary_key=True)
    skill_id = Column(Integer, ForeignKey("skill.id"), primary_key=True)
    proficiency_level = Column(String(30), nullable=True)
