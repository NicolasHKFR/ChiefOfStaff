import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import type {
  Department,
  Document,
  LeaveRequest,
  LeaveType,
  OrgChartNode,
  Position,
  Skill,
  Team,
  Worker,
} from "../../types";

/* Workers */
export function useWorkers(params?: { department_id?: number; status?: string; q?: string }) {
  return useQuery({
    queryKey: ["workers", params],
    queryFn: () => client.get("/workers", { params }).then((r) => r.data as Worker[]),
  });
}

export function useWorker(id: number) {
  return useQuery({
    queryKey: ["worker", id],
    queryFn: () => client.get(`/workers/${id}`).then((r) => r.data as Worker),
    enabled: !!id,
  });
}

export function useCreateWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Worker>) => client.post("/workers", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workers"] }),
  });
}

export function useUpdateWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Worker> }) =>
      client.patch(`/workers/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workers"] });
      qc.invalidateQueries({ queryKey: ["worker"] });
      qc.invalidateQueries({ queryKey: ["orgChart"] });
    },
  });
}

/* Org Chart */
export function useOrgChart() {
  return useQuery({
    queryKey: ["orgChart"],
    queryFn: () => client.get("/org-chart").then((r) => r.data as OrgChartNode),
  });
}

/* Departments */
export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => client.get("/departments").then((r) => r.data as Department[]),
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Department>) => client.post("/departments", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Department> }) =>
      client.patch(`/departments/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });
}

/* Teams */
export function useTeams(department_id?: number) {
  return useQuery({
    queryKey: ["teams", department_id],
    queryFn: () => client.get("/teams", { params: { department_id } }).then((r) => r.data as Team[]),
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Team>) => client.post("/teams", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

/* Positions */
export function usePositions() {
  return useQuery({
    queryKey: ["positions"],
    queryFn: () => client.get("/positions").then((r) => r.data as Position[]),
  });
}

export function useCreatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Position>) => client.post("/positions", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["positions"] }),
  });
}

export function useUpdatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Position> }) =>
      client.patch(`/positions/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["positions"] }),
  });
}

/* Skills */
export function useSkills(q?: string) {
  return useQuery({
    queryKey: ["skills", q],
    queryFn: () => client.get("/skills", { params: { q } }).then((r) => r.data as Skill[]),
  });
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Skill>) => client.post("/skills", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills"] }),
  });
}

/* Documents */
export function useDocuments(worker_id?: number) {
  return useQuery({
    queryKey: ["documents", worker_id],
    queryFn: () => client.get("/documents", { params: { worker_id } }).then((r) => r.data as Document[]),
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ worker_id, category, file, visibility_scope }: {
      worker_id: number;
      category: string;
      file: File;
      visibility_scope?: string;
    }) => {
      const fd = new FormData();
      fd.append("worker_id", String(worker_id));
      fd.append("category", category);
      fd.append("file", file);
      if (visibility_scope) fd.append("visibility_scope", visibility_scope);
      return client.post("/documents", fd).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => client.delete(`/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

/* Leave */
export function useLeaveTypes() {
  return useQuery({
    queryKey: ["leaveTypes"],
    queryFn: () => client.get("/leave-requests/types").then((r) => r.data as LeaveType[]),
  });
}

export function useLeaveRequests(worker_id?: number) {
  return useQuery({
    queryKey: ["leaveRequests", worker_id],
    queryFn: () => client.get("/leave-requests", { params: { worker_id } }).then((r) => r.data as LeaveRequest[]),
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LeaveRequest>) => client.post("/leave-requests", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leaveRequests"] }),
  });
}

export function useUpdateLeaveStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, approver_id }: { id: number; status: string; approver_id: number }) =>
      client.patch(`/leave-requests/${id}`, null, { params: { status, approver_id } }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leaveRequests"] }),
  });
}

/* Reports */
export function useHeadcountReport() {
  return useQuery({
    queryKey: ["report", "headcount"],
    queryFn: () => client.get("/reports/headcount").then((r) => r.data),
  });
}

export function useSalaryReport() {
  return useQuery({
    queryKey: ["report", "salary"],
    queryFn: () => client.get("/reports/salary").then((r) => r.data),
  });
}

export function useLeaveStats() {
  return useQuery({
    queryKey: ["report", "leave-stats"],
    queryFn: () => client.get("/reports/leave-stats").then((r) => r.data),
  });
}

/* Presence */
export function usePresence() {
  return useQuery({
    queryKey: ["presence"],
    queryFn: () => client.get("/presence").then((r) => r.data),
  });
}

/* Search */
export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => client.get("/search", { params: { q } }).then((r) => r.data),
    enabled: q.length > 0,
  });
}
