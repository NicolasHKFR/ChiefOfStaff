export interface Worker {
  id: number;
  type: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  team_id?: number;
  start_date?: string;
  end_date?: string;
  status: string;
  office_location?: string;
  custom_fields?: Record<string, unknown>;
}

export interface Team {
  id: number;
  name: string;
  manager_id?: number;
  parent_team_id?: number;
}

export interface Skill {
  id: number;
  name: string;
  category?: string;
}

export interface Document {
  id: number;
  worker_id: number;
  category: string;
  file_url: string;
  uploaded_at?: string;
  visibility_scope?: string;
}

export interface AuditLog {
  id: number;
  entity_type: string;
  entity_id: number;
  field_changed: string;
  previous_value?: string;
  new_value?: string;
  changed_by: number;
  changed_at?: string;
}

export interface QualityCheck {
  id: number;
  name: string;
  description?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface QCFile {
  id: number;
  quality_check_id: number;
  original_filename: string;
  uploaded_at?: string;
  row_count?: number;
}

export interface QCCheck {
  id: number;
  quality_check_id: number;
  check_type: string;
  status: string;
  summary?: string;
  details_json?: Record<string, unknown>;
  created_at?: string;
}

export interface QualityCheckDetail extends QualityCheck {
  files: QCFile[];
  checks: QCCheck[];
}

export interface WorkerType {
  id: number;
  name: string;
}

export interface Location {
  id: number;
  name: string;
  address?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

export interface BackupInfo {
  filename: string;
  size: number;
  created_at: string;
}

export interface OrgChartTeamNode {
  id: number;
  name: string;
  manager: { id: number; first_name: string; last_name: string; photo_url?: string } | null;
  members: { id: number; first_name: string; last_name: string; photo_url?: string }[];
  children: OrgChartTeamNode[];
}
