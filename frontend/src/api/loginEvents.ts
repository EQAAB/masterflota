import { api } from "../lib/api";

export type LoginEventItem = {
  id: string;
  organizationId: string | null;
  userId: string | null;
  emailAttempted: string;
  userEmail: string | null;
  userName: string | null;
  eventType: string;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
  sessionId: string | null;
  createdAt: string;
};

export type LoginEventsResponse = {
  items: LoginEventItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type LoginEventsSummary = {
  hours: number;
  success_count: number;
  failed_count: number;
  unique_failed_ips: number;
  suspicious_ips: { ipAddress: string; attemptCount: number }[];
  suspicious_emails: { email: string; attemptCount: number }[];
  recent_failed_spike: boolean;
};

export type LoginEventsParams = {
  page?: number;
  limit?: number;
  eventType?: string;
  email?: string;
  ip?: string;
  userId?: string;
  from?: string;
  to?: string;
  suspiciousOnly?: boolean;
  suspiciousHours?: number;
};

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function fetchLoginEvents(params: LoginEventsParams = {}) {
  return api.get<LoginEventsResponse>(
    `/login-events${buildQuery({
      page: params.page,
      limit: params.limit,
      eventType: params.eventType,
      email: params.email,
      ip: params.ip,
      userId: params.userId,
      from: params.from,
      to: params.to,
      suspiciousOnly: params.suspiciousOnly ? "true" : undefined,
      suspiciousHours: params.suspiciousHours,
    })}`,
  );
}

export function fetchLoginEventsSummary(hours = 24) {
  return api.get<LoginEventsSummary>(`/login-events/summary?hours=${hours}`);
}
