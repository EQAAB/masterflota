import { Router } from "express";
import type { Request } from "express";
import { query } from "../../db/pool";
import { authenticateJWT, isPlatformSuperAdminUser, requirePermission } from "../../middleware/auth";
import { attachOrgContext } from "../../middleware/orgContext";
import {
  FAILED_ATTEMPT_THRESHOLD,
  buildLoginEventListWhere,
  buildLoginEventOrgScopeForSummary,
  computeRecentFailedSpike,
  formatLocation,
} from "./loginEventQueries";

const router = Router();

router.use(authenticateJWT);
router.use(attachOrgContext);
router.use(requirePermission("users.manage"));

function resolveOrgScope(req: Request): { orgId: string | null; platformViewAll: boolean } {
  const platformViewAll =
    Boolean(req.user && isPlatformSuperAdminUser(req.user) && !req.effectiveOrgId);
  const orgId = platformViewAll ? null : (req.effectiveOrgId ?? null);
  return { orgId, platformViewAll };
}

type LoginEventRow = {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  email_attempted: string;
  event_type: string;
  failure_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  session_id: string | null;
  created_at: string;
  user_email: string | null;
  first_name: string | null;
  last_name: string | null;
};

router.get("/summary", async (req, res) => {
  const { orgId, platformViewAll } = resolveOrgScope(req);
  if (!platformViewAll && !orgId) {
    return res.status(400).json({ message: "Organization context is required" });
  }

  const hours = Math.min(168, Math.max(1, Number(req.query.hours) || 24));

  const orgPart = buildLoginEventOrgScopeForSummary(orgId, platformViewAll);
  const baseWhere = `${orgPart.sql} AND le.created_at >= NOW() - ($${orgPart.nextIndex}::int * INTERVAL '1 hour')`;
  const baseParams = [...orgPart.params, hours];

  try {
    const countsRes = await query<{
      success_count: string;
      failed_count: string;
      unique_failed_ips: string;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE le.event_type = 'login.success')::text AS success_count,
         COUNT(*) FILTER (WHERE le.event_type = 'login.failed')::text AS failed_count,
         COUNT(DISTINCT le.ip_address) FILTER (
           WHERE le.event_type = 'login.failed' AND le.ip_address IS NOT NULL
         )::text AS unique_failed_ips
       FROM login_events le
       WHERE ${baseWhere}`,
      baseParams,
    );
    const counts = countsRes.rows[0];

    const suspiciousIpRes = await query<{ ip_address: string; attempt_count: string }>(
      `SELECT le.ip_address::text AS ip_address, COUNT(*)::text AS attempt_count
       FROM login_events le
       WHERE ${baseWhere}
         AND le.event_type = 'login.failed'
         AND le.ip_address IS NOT NULL
       GROUP BY le.ip_address
       HAVING COUNT(*) >= ${FAILED_ATTEMPT_THRESHOLD}
       ORDER BY COUNT(*) DESC
       LIMIT 20`,
      baseParams,
    );

    const suspiciousEmailRes = await query<{ email_attempted: string; attempt_count: string }>(
      `SELECT le.email_attempted, COUNT(*)::text AS attempt_count
       FROM login_events le
       WHERE ${baseWhere}
         AND le.event_type = 'login.failed'
       GROUP BY le.email_attempted
       HAVING COUNT(*) >= ${FAILED_ATTEMPT_THRESHOLD}
       ORDER BY COUNT(*) DESC
       LIMIT 20`,
      baseParams,
    );

    const hoursParamIdx = orgPart.nextIndex;
    const priorParams = [...orgPart.params, hours];
    const priorOrgSql = orgPart.sql;
    const spikeWhere = `${priorOrgSql} AND le.created_at >= NOW() - INTERVAL '1 hour'`;
    const priorWhere = `${priorOrgSql} AND le.created_at >= NOW() - ($${hoursParamIdx}::int * INTERVAL '1 hour')
      AND le.created_at < NOW() - INTERVAL '1 hour'`;

    const lastHourRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM login_events le
       WHERE ${spikeWhere} AND le.event_type = 'login.failed'`,
      orgPart.params,
    );
    const priorRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM login_events le
       WHERE ${priorWhere} AND le.event_type = 'login.failed'`,
      priorParams,
    );

    const failedLastHour = Number(lastHourRes.rows[0]?.count ?? 0);
    const failedPriorHours = Number(priorRes.rows[0]?.count ?? 0);
    const priorHours = Math.max(1, hours - 1);

    return res.json({
      hours,
      success_count: Number(counts?.success_count ?? 0),
      failed_count: Number(counts?.failed_count ?? 0),
      unique_failed_ips: Number(counts?.unique_failed_ips ?? 0),
      suspicious_ips: suspiciousIpRes.rows.map((r) => ({
        ipAddress: r.ip_address,
        attemptCount: Number(r.attempt_count),
      })),
      suspicious_emails: suspiciousEmailRes.rows.map((r) => ({
        email: r.email_attempted,
        attemptCount: Number(r.attempt_count),
      })),
      recent_failed_spike: computeRecentFailedSpike(failedLastHour, failedPriorHours, priorHours),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Login events summary error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  const { orgId, platformViewAll } = resolveOrgScope(req);
  if (!platformViewAll && !orgId) {
    return res.status(400).json({ message: "Organization context is required" });
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const offset = (page - 1) * limit;

  const eventType = typeof req.query.eventType === "string" ? req.query.eventType : undefined;
  const email = typeof req.query.email === "string" ? req.query.email : undefined;
  const ip = typeof req.query.ip === "string" ? req.query.ip : undefined;
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  const suspiciousOnly = req.query.suspiciousOnly === "true" || req.query.suspiciousOnly === "1";
  const suspiciousHours = Math.min(168, Math.max(1, Number(req.query.suspiciousHours) || 24));

  const wherePart = buildLoginEventListWhere({
    orgId,
    platformViewAll,
    eventType,
    email,
    ip,
    userId,
    from,
    to,
    suspiciousOnly,
    suspiciousHours,
  });

  try {
    const countRes = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
       FROM login_events le
       WHERE ${wherePart.sql}`,
      wherePart.params,
    );
    const total = Number(countRes.rows[0]?.total ?? 0);

    const listParams = [...wherePart.params, limit, offset];
    const { rows } = await query<LoginEventRow>(
      `SELECT le.id::text, le.organization_id::text, le.user_id::text,
              le.email_attempted, le.event_type, le.failure_reason,
              le.ip_address::text, le.user_agent,
              le.city, le.region, le.country,
              le.session_id::text, le.created_at::text,
              u.email AS user_email, u.first_name, u.last_name
       FROM login_events le
       LEFT JOIN users u ON u.id = le.user_id
       WHERE ${wherePart.sql}
       ORDER BY le.created_at DESC
       LIMIT $${wherePart.nextIndex} OFFSET $${wherePart.nextIndex + 1}`,
      listParams,
    );

    return res.json({
      items: rows.map((r) => ({
        id: r.id,
        organizationId: r.organization_id,
        userId: r.user_id,
        emailAttempted: r.email_attempted,
        userEmail: r.user_email,
        userName:
          r.first_name && r.last_name ? `${r.first_name} ${r.last_name}` : null,
        eventType: r.event_type,
        failureReason: r.failure_reason,
        ipAddress: r.ip_address,
        userAgent: r.user_agent,
        location: formatLocation(r.city, r.region, r.country),
        sessionId: r.session_id,
        createdAt: r.created_at,
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("List login events error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const loginEventRoutes = router;
