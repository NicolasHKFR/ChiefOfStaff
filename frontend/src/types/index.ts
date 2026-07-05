export interface Worker {
  id: number;
  type: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  email?: string;
  phone?: string;
  job_title?: string;
  team_id?: number;
  manager_id?: number;
  employment_type?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  office_location?: string;
  contract_end_date?: string;
  custom_fields?: Record<string, unknown>;
}

export interface Team {
  id: number;
  name: string;
  manager_id?: number;
  parent_team_id?: number;
}

export interface Position {
  id: number;
  job_title: string;
  team_id?: number;
  employment_type?: string;
  status: string;
  target_start_date?: string;
  linked_worker_id?: number;
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

export interface OrgChartNode {
  id: number;
  first_name: string;
  last_name: string;
  job_title?: string;
  photo_url?: string;
  children: OrgChartNode[];
}
