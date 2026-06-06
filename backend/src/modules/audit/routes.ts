import { Router } from "express";
import { query } from "../../db/pool";
import { authenticateJWT, requirePermission } from "../../middleware/auth";
import { attachOrgContext, requireOrgId } from "../../middleware/orgContext";

const router = Router();

router.use(authenticateJWT);
router.use(attachOrgContext);
router.use(requirePermission("users.manage"));

type AuditRow = {
  id: string;
  user_id: string | null;
  actor_email: string | null;
  actor_first_name: string | null;
  actor_last_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  ip_address: string | null;
  created_at: string;
};

router.get("/", async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const offset = (page - 1) * limit;
  const entityType = typeof req.query.entityType === "string" ? req.query.entityType : undefined;
  const action = typeof req.query.action === "string" ? req.query.action : undefined;
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;

  const conditions = ["a.organization_id = $1::uuid"];
  const params: unknown[] = [orgId];
  let idx = 2;

  if (entityType) {
    conditions.push(`a.entity_type = $${idx}`);
    params.push(entityType);
    idx += 1;
  }
  if (action) {
    conditions.push(`a.action = $${idx}`);
    params.push(action);
    idx += 1;
  }
  if (userId) {
    conditions.push(`a.user_id = $${idx}::uuid`);
    params.push(userId);
    idx += 1;
  }

  const where = conditions.join(" AND ");

  try {
    const countRes = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM audit_logs a WHERE ${where}`,
      params,
    );
    const total = Number(countRes.rows[0]?.total ?? 0);

    const listParams = [...params, limit, offset];
    const { rows } = await query<AuditRow>(
      `SELECT a.id::text, a.user_id::text, u.email AS actor_email,
              u.first_name AS actor_first_name, u.last_name AS actor_last_name,
              a.action, a.entity_type, a.entity_id::text, a.old_value, a.new_value,
              a.ip_address::text, a.created_at::text
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE ${where}
       ORDER BY a.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      listParams,
    );

    return res.json({
      items: rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        actorEmail: r.actor_email,
        actorName:
          r.actor_first_name && r.actor_last_name
            ? `${r.actor_first_name} ${r.actor_last_name}`
            : null,
        action: r.action,
        entityType: r.entity_type,
        entityId: r.entity_id,
        oldValue: r.old_value,
        newValue: r.new_value,
        ipAddress: r.ip_address,
        createdAt: r.created_at,
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("List audit logs error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const auditRoutes = router;
