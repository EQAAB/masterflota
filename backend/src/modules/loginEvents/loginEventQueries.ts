export const FAILED_ATTEMPT_THRESHOLD = 5;

export type LoginEventListFilters = {
  orgId?: string | null;
  platformViewAll?: boolean;
  eventType?: string;
  email?: string;
  ip?: string;
  userId?: string;
  from?: string;
  to?: string;
  suspiciousOnly?: boolean;
  suspiciousHours?: number;
};

export type SqlFragment = {
  sql: string;
  params: unknown[];
  nextIndex: number;
};

function appendCondition(
  conditions: string[],
  params: unknown[],
  idx: number,
  sql: string,
  value: unknown,
): number {
  conditions.push(sql);
  params.push(value);
  return idx + 1;
}

export function buildLoginEventOrgClause(
  orgId: string | null | undefined,
  platformViewAll: boolean,
): SqlFragment {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (platformViewAll) {
    return { sql: "TRUE", params, nextIndex: idx };
  }

  if (orgId) {
    appendCondition(conditions, params, idx, `le.organization_id = $${idx}::uuid`, orgId);
    idx += 1;
  } else {
    conditions.push("le.organization_id IS NULL");
  }

  return {
    sql: conditions.length > 0 ? conditions.join(" AND ") : "TRUE",
    params,
    nextIndex: idx,
  };
}

export function buildLoginEventListWhere(filters: LoginEventListFilters): SqlFragment {
  const orgPart = buildLoginEventOrgClause(filters.orgId, Boolean(filters.platformViewAll));
  const conditions: string[] = [orgPart.sql];
  const params: unknown[] = [...orgPart.params];
  let idx = orgPart.nextIndex;

  if (filters.eventType?.trim()) {
    idx = appendCondition(
      conditions,
      params,
      idx,
      `le.event_type = $${idx}`,
      filters.eventType.trim(),
    );
  }
  if (filters.email?.trim()) {
    idx = appendCondition(
      conditions,
      params,
      idx,
      `le.email_attempted ILIKE $${idx}`,
      `%${filters.email.trim().toLowerCase()}%`,
    );
  }
  if (filters.ip?.trim()) {
    idx = appendCondition(
      conditions,
      params,
      idx,
      `le.ip_address::text ILIKE $${idx}`,
      `%${filters.ip.trim()}%`,
    );
  }
  if (filters.userId?.trim()) {
    idx = appendCondition(
      conditions,
      params,
      idx,
      `le.user_id = $${idx}::uuid`,
      filters.userId.trim(),
    );
  }
  if (filters.from?.trim()) {
    idx = appendCondition(
      conditions,
      params,
      idx,
      `le.created_at >= $${idx}::timestamptz`,
      filters.from.trim(),
    );
  }
  if (filters.to?.trim()) {
    idx = appendCondition(
      conditions,
      params,
      idx,
      `le.created_at <= $${idx}::timestamptz`,
      filters.to.trim(),
    );
  }

  if (filters.suspiciousOnly) {
    const hours = filters.suspiciousHours ?? 24;
    let orgScope = "TRUE";
    if (!filters.platformViewAll) {
      if (filters.orgId) {
        orgScope = "organization_id = $1::uuid";
      } else {
        orgScope = "organization_id IS NULL";
      }
    }

    const hoursIdx = idx;
    params.push(hours);
    idx += 1;

    const suspiciousIpSubquery = `
      SELECT ip_address::text AS ip
      FROM login_events
      WHERE event_type = 'login.failed'
        AND ip_address IS NOT NULL
        AND created_at >= NOW() - ($${hoursIdx}::int * INTERVAL '1 hour')
        AND ${orgScope}
      GROUP BY ip_address
      HAVING COUNT(*) >= ${FAILED_ATTEMPT_THRESHOLD}`;

    const suspiciousEmailSubquery = `
      SELECT email_attempted AS email
      FROM login_events
      WHERE event_type = 'login.failed'
        AND created_at >= NOW() - ($${hoursIdx}::int * INTERVAL '1 hour')
        AND ${orgScope}
      GROUP BY email_attempted
      HAVING COUNT(*) >= ${FAILED_ATTEMPT_THRESHOLD}`;

    conditions.push(`(
      (le.ip_address IS NOT NULL AND le.ip_address::text IN (${suspiciousIpSubquery}))
      OR le.email_attempted IN (${suspiciousEmailSubquery})
    )`);
  }

  return {
    sql: conditions.join(" AND "),
    params,
    nextIndex: idx,
  };
}

export function buildLoginEventOrgScopeForSummary(
  orgId: string | null | undefined,
  platformViewAll: boolean,
): { sql: string; params: unknown[]; nextIndex: number } {
  return buildLoginEventOrgClause(orgId, platformViewAll);
}

/** True when last-hour failures exceed 2× the average hourly rate over the prior window. */
export function computeRecentFailedSpike(
  failedLastHour: number,
  failedPriorHours: number,
  priorHours: number,
): boolean {
  if (failedLastHour < FAILED_ATTEMPT_THRESHOLD) return false;
  if (priorHours <= 0) return failedLastHour >= FAILED_ATTEMPT_THRESHOLD;
  const priorHourlyAvg = failedPriorHours / priorHours;
  if (priorHourlyAvg <= 0) return failedLastHour >= FAILED_ATTEMPT_THRESHOLD;
  return failedLastHour > priorHourlyAvg * 2;
}

export function formatLocation(city: string | null, region: string | null, country: string | null): string | null {
  const parts = [city, region, country].filter((p) => p && p.trim());
  return parts.length > 0 ? parts.join(", ") : null;
}
