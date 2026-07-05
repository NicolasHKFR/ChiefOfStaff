from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, func

from app.database import Base


class LeaveType(Base):
    __tablename__ = "leave_type"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    requires_approval = Column(Integer, nullable=False, default=1)


class LeaveRequest(Base):
    __tablename__ = "leave_request"

    id = Column(Integer, primary_key=True, autoincrement=True)
    worker_id = Column(Integer, ForeignKey("worker.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_type.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    comment = Column(String(1000), nullable=True)
    status = Column(String(20), nullable=False, default="Pending")
    approver_id = Column(Integer, ForeignKey("worker.id"), nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)
