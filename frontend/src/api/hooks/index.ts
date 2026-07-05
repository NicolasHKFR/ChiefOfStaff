import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import type {
  BackupInfo,
  Document,
  Location,
  OrgChartTeamNode,
  QCCheck,
  QCFile,
  QualityCheck,
  QualityCheckDetail,
  Skill,
  Team,
  Worker,
  WorkerType,
} from "../../types";

/* Workers */
export function useWorkers(params?: { status?: string; q?: string }) {
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
      qc.invalidateQueries({ queryKey: ["teams"] });
      qc.invalidateQueries({ queryKey: ["orgChart"] });
    },
  });
}

export function useDeleteWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => client.delete(`/workers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workers"] });
      qc.invalidateQueries({ queryKey: ["orgChart"] });
    },
  });
}

/* Org Chart */
export function useOrgChart() {
  return useQuery({
    queryKey: ["orgChart"],
    queryFn: () => client.get("/org-chart").then((r) => r.data as OrgChartTeamNode[]),
  });
}

/* Teams */
export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: () => client.get("/teams").then((r) => r.data as Team[]),
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Team>) => client.post("/teams", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Team> }) =>
      client.patch(`/teams/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => client.delete(`/teams/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      qc.invalidateQueries({ queryKey: ["orgChart"] });
    },
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

/* Reports */
export function useHeadcountReport() {
  return useQuery({
    queryKey: ["report", "headcount"],
    queryFn: () => client.get("/reports/headcount").then((r) => r.data),
  });
}

/* Presence */
export function usePresence() {
  return useQuery({
    queryKey: ["presence"],
    queryFn: () => client.get("/presence").then((r) => r.data),
  });
}

/* Quality Checks */
export function useQualityChecks() {
  return useQuery({
    queryKey: ["qualityChecks"],
    queryFn: () => client.get("/quality-checks").then((r) => r.data as QualityCheck[]),
  });
}

export function useQualityCheck(id: number) {
  return useQuery({
    queryKey: ["qualityCheck", id],
    queryFn: () => client.get(`/quality-checks/${id}`).then((r) => r.data as QualityCheckDetail),
    enabled: !!id,
  });
}

export function useCreateQualityCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      client.post("/quality-checks", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qualityChecks"] }),
  });
}

export function useDeleteQualityCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => client.delete(`/quality-checks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qualityChecks"] }),
  });
}

export function useUploadQCFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ qcId, file }: { qcId: number; file: File }) => {
      const fd = new FormData();
      fd.append("file", file);
      return client.post(`/quality-checks/${qcId}/upload`, fd).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qualityChecks"] });
      qc.invalidateQueries({ queryKey: ["qualityCheck"] });
    },
  });
}

/* Locations */
export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: () => client.get("/locations").then((r) => r.data as Location[]),
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; address?: string }) =>
      client.post("/locations", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Location> }) =>
      client.patch(`/locations/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => client.delete(`/locations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  });
}

/* Worker Types */
export function useWorkerTypes() {
  return useQuery({
    queryKey: ["worker-types"],
    queryFn: () => client.get("/worker-types").then((r) => r.data as WorkerType[]),
  });
}

export function useCreateWorkerType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      client.post("/worker-types", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["worker-types"] }),
  });
}

export function useUpdateWorkerType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WorkerType> }) =>
      client.patch(`/worker-types/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["worker-types"] }),
  });
}

export function useDeleteWorkerType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => client.delete(`/worker-types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["worker-types"] }),
  });
}

/* Backup */
export function useBackups() {
  return useQuery({
    queryKey: ["backups"],
    queryFn: () => client.get("/backup").then((r) => r.data as BackupInfo[]),
  });
}

export function useCreateBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => client.post("/backup").then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backups"] }),
  });
}

export function useRestoreBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (filename: string) => client.post(`/backup/restore/${filename}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backups"] });
      qc.invalidateQueries();
    },
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
