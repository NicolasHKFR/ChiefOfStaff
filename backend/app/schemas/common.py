from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class Message(BaseModel):
    detail: str


class OrgChartNode(BaseModel):
    id: int
    first_name: str
    last_name: str
    job_title: Optional[str] = None
    photo_url: Optional[str] = None
    children: list["OrgChartNode"] = []


class WorkerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    first_name: str
    last_name: str
    photo_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    team_id: Optional[int] = None
    manager_id: Optional[int] = None
    employment_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "Active"
    office_location: Optional[str] = None
    contract_end_date: Optional[date] = None
    custom_fields: Optional[dict] = None


class WorkerCreate(BaseModel):
    type: str
    first_name: str
    last_name: str
    photo_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    team_id: Optional[int] = None
    manager_id: Optional[int] = None
    employment_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "Active"
    office_location: Optional[str] = None
    contract_end_date: Optional[date] = None
    custom_fields: Optional[dict] = None


class WorkerUpdate(BaseModel):
    type: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    team_id: Optional[int] = None
    manager_id: Optional[int] = None
    employment_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    office_location: Optional[str] = None
    contract_end_date: Optional[date] = None
    custom_fields: Optional[dict] = None


class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    manager_id: Optional[int] = None
    parent_team_id: Optional[int] = None


class TeamCreate(BaseModel):
    name: str
    manager_id: Optional[int] = None
    parent_team_id: Optional[int] = None


class PositionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    job_title: str
    team_id: Optional[int] = None
    employment_type: Optional[str] = None
    status: str
    target_start_date: Optional[date] = None
    linked_worker_id: Optional[int] = None


class PositionCreate(BaseModel):
    job_title: str
    team_id: Optional[int] = None
    employment_type: Optional[str] = None
    status: str = "Vacant"
    target_start_date: Optional[date] = None
    linked_worker_id: Optional[int] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    manager_id: Optional[int] = None
    parent_team_id: Optional[int] = None


class PositionUpdate(BaseModel):
    job_title: Optional[str] = None
    team_id: Optional[int] = None
    employment_type: Optional[str] = None
    status: Optional[str] = None
    target_start_date: Optional[date] = None
    linked_worker_id: Optional[int] = None


class SkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    category: Optional[str] = None


class SkillCreate(BaseModel):
    name: str
    category: Optional[str] = None


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    worker_id: int
    category: str
    file_url: str
    uploaded_at: Optional[datetime] = None
    visibility_scope: Optional[str] = None


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entity_type: str
    entity_id: int
    field_changed: str
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by: int
    changed_at: Optional[datetime] = None


class OrganizationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    settings: dict
