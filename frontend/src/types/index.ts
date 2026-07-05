export interface Worker {
  id: number;
  type: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  email?: string;
  phone?: string;
  team_id?: number;
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

export interface OrgChartTeamNode {
  id: number;
  name: string;
  manager: { id: number; first_name: string; last_name: string; photo_url?: string } | null;
  members: { id: number; first_name: string; last_name: string; photo_url?: string }[];
  children: OrgChartTeamNode[];
}
