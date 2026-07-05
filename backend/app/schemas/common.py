from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class Message(BaseModel):
    detail: str


class OrgChartNode(BaseModel):
    id: int
    first_name: str
    last_name: str
    photo_url: Optional[str] = None
    children: list["OrgChartNode"] = []


class WorkerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    first_name: str
    last_name: str
    photo_url: Optional[str] = None
    team_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "Active"
    office_location: Optional[str] = None
    custom_fields: Optional[dict] = None


class WorkerCreate(BaseModel):
    type: str
    first_name: str
    last_name: str
    photo_url: Optional[str] = None
    team_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "Active"
    office_location: Optional[str] = None
    custom_fields: Optional[dict] = None


class WorkerUpdate(BaseModel):
    type: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    team_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    office_location: Optional[str] = None
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


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    manager_id: Optional[int] = None
    parent_team_id: Optional[int] = None


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


class QualityCheckOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = None
    status: str = "created"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class QualityCheckCreate(BaseModel):
    name: str
    description: Optional[str] = None


class QCFileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    quality_check_id: int
    original_filename: str
    uploaded_at: Optional[datetime] = None
    row_count: Optional[int] = None


class QCCheckOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    quality_check_id: int
    check_type: str
    status: str
    summary: Optional[str] = None
    details_json: Optional[dict] = None
    created_at: Optional[datetime] = None



class LocationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    address: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: Optional[datetime] = None


class LocationCreate(BaseModel):
    name: str
    address: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class WorkerTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class WorkerTypeCreate(BaseModel):
    name: str


class WorkerTypeUpdate(BaseModel):
    name: Optional[str] = None


class QualityCheckDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    files: list[QCFileOut] = []
    checks: list[QCCheckOut] = []
