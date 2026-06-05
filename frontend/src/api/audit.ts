import { api } from "../lib/api";

export type AuditLogItem = {
  id: string;
  userId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: unknown;
  newValue: unknown;
  ipAddress: string | null;
  createdAt: string;
};

export type AuditLogResponse = {
  items: AuditLogItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AuditLogParams = {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: string;
  userId?: string;
};

export function fetchAuditLogs(params: AuditLogParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.entityType) q.set("entityType", params.entityType);
  if (params.action) q.set("action", params.action);
  if (params.userId) q.set("userId", params.userId);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return api.get<AuditLogResponse>(`/audit-logs${suffix}`);
}
