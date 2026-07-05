from sqlalchemy import Column, ForeignKey, Integer, String

from app.database import Base


class Department(Base):
    __tablename__ = "department"

    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organization.id"), nullable=False)
    name = Column(String(255), nullable=False)
    cost_center_id = Column(String(100), nullable=True)
    parent_department_id = Column(Integer, ForeignKey("department.id"), nullable=True)
