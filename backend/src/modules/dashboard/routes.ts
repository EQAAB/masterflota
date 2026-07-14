import { Router } from "express";
import { authenticateJWT, requirePermission } from "../../middleware/auth";
import { attachOrgContext, requireOrgId } from "../../middleware/orgContext";
import { query } from "../../db/pool";
import { handleRecentAssignments } from "../vehicles/vehicleAssignmentHistoryHandlers";

const router = Router();

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseIsoDateParam(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = ISO_DATE_RE.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(Date.UTC(y, month - 1, day));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** Parse inclusive from/to query params. Defaults to current UTC calendar week-ish (caller should send both). */
function parsePeriodQuery(req: { query: Record<string, unknown> }): { from: string; to: string } | { error: string } {
  const from = parseIsoDateParam(req.query.from);
  const to = parseIsoDateParam(req.query.to);
  if (!from || !to) {
    return { error: "Query params from and to (YYYY-MM-DD) are required" };
  }
  if (from > to) {
    return { error: "from must be on or before to" };
  }
  return { from, to };
}

router.use(authenticateJWT);
router.use(attachOrgContext);
router.use(requirePermission("dashboard.view"));

router.get("/stats", async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const period = parsePeriodQuery(req);
  if ("error" in period) {
    return res.status(400).json({ message: period.error });
  }
  const { from, to } = period;

  try {
    const [
      driversRes,
      activeRes,
      pendingDocsRes,
      expiredDocsRes,
      vehiclesRes,
      assignedVehiclesRes,
      totalCommissionRes,
      pendingPaymentsRes,
      vehicleRentalFeesRes,
    ] = await Promise.all([
      query<{ count: string }>("SELECT COUNT(*) as count FROM drivers WHERE organization_id = $1", [orgId]),
      query<{ count: string }>(
        "SELECT COUNT(*) as count FROM drivers WHERE organization_id = $1 AND employment_status = 'active'",
        [orgId],
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM driver_documents d
         JOIN drivers dr ON d.driver_id = dr.id
         WHERE dr.organization_id = $1 AND d.is_verified = false`,
        [orgId],
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM driver_documents d
         JOIN drivers dr ON d.driver_id = dr.id
         WHERE dr.organization_id = $1 AND d.expiry_date IS NOT NULL AND d.expiry_date < CURRENT_DATE`,
        [orgId],
      ),
      query<{ count: string }>("SELECT COUNT(*) as count FROM vehicles WHERE organization_id = $1", [orgId]),
      query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM drivers
         WHERE organization_id = $1 AND current_vehicle_id IS NOT NULL
           AND (is_deleted = false OR is_deleted IS NULL)`,
        [orgId],
      ),
      // Period-based money KPIs: payout weeks overlapping selected range
      query<{ total: string | null }>(
        `SELECT COALESCE(SUM(company_commission), 0)::text as total
         FROM driver_payouts
         WHERE organization_id = $1
           AND payment_status IN ('paid', 'approved')
           AND payment_period_start <= $3::date
           AND payment_period_end >= $2::date`,
        [orgId, from, to],
      ),
      query<{ total: string | null }>(
        `SELECT COALESCE(SUM(net_driver_payout), 0)::text as total
         FROM driver_payouts
         WHERE organization_id = $1
           AND payment_status = 'pending'
           AND payment_period_start <= $3::date
           AND payment_period_end >= $2::date`,
        [orgId, from, to],
      ),
      query<{ total: string | null }>(
        `SELECT COALESCE(SUM(vehicle_rental_fee), 0)::text as total
         FROM driver_payouts
         WHERE organization_id = $1
           AND payment_period_start <= $3::date
           AND payment_period_end >= $2::date`,
        [orgId, from, to],
      ),
    ]);

    const totalDrivers = parseInt(driversRes.rows[0]?.count ?? "0", 10);
    const activeDrivers = parseInt(activeRes.rows[0]?.count ?? "0", 10);
    const pendingDocuments = parseInt(pendingDocsRes.rows[0]?.count ?? "0", 10);
    const expiredDocuments = parseInt(expiredDocsRes.rows[0]?.count ?? "0", 10);
    const totalVehicles = parseInt(vehiclesRes.rows[0]?.count ?? "0", 10);
    const assignedVehicles = parseInt(assignedVehiclesRes.rows[0]?.count ?? "0", 10);
    const totalCommissionEarned = parseFloat(totalCommissionRes.rows[0]?.total ?? "0");
    const pendingPayments = parseFloat(pendingPaymentsRes.rows[0]?.total ?? "0");
    const totalVehicleRentalFees = parseFloat(vehicleRentalFeesRes.rows[0]?.total ?? "0");

    return res.json({
      totalDrivers,
      activeDrivers,
      pendingDocuments,
      expiredDocuments,
      totalVehicles,
      assignedVehicles,
      totalCommissionEarned,
      pendingPayments,
      totalVehicleRentalFees,
      periodFrom: from,
      periodTo: to,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Dashboard stats error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/drivers/status", async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  try {
    const { rows } = await query<{ employment_status: string; count: string }>(
      `SELECT employment_status, COUNT(*)::text as count
       FROM drivers WHERE organization_id = $1
       GROUP BY employment_status`,
      [orgId],
    );

    return res.json(
      rows.map((r) => ({ status: r.employment_status, count: parseInt(r.count, 10) })),
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Dashboard driver status error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/documents", async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  try {
    const { rows } = await query<{ document_type: string; total: string; verified: string }>(
      `SELECT d.document_type,
              COUNT(*)::text as total,
              SUM(CASE WHEN d.is_verified = true THEN 1 ELSE 0 END)::text as verified
       FROM driver_documents d
       JOIN drivers dr ON d.driver_id = dr.id
       WHERE dr.organization_id = $1
       GROUP BY d.document_type`,
      [orgId],
    );
    return res.json(
      rows.map((r) => ({
        documentType: r.document_type,
        total: parseInt(r.total, 10),
        verified: parseInt(r.verified, 10),
        pending: parseInt(r.total, 10) - parseInt(r.verified, 10),
      })),
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Dashboard documents error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/recent-assignments", handleRecentAssignments);

router.get("/activity", async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const period = parsePeriodQuery(req);
  if ("error" in period) {
    return res.status(400).json({ message: period.error });
  }
  const { from, to } = period;

  try {
    const { rows } = await query(
      `SELECT a.id, a.driver_id, a.activity_type, a.activity_description, a.performed_by, a.created_at
       FROM driver_activities a
       JOIN drivers d ON a.driver_id = d.id
       WHERE d.organization_id = $1
         AND a.created_at::date >= $2::date
         AND a.created_at::date <= $3::date
       ORDER BY a.created_at DESC
       LIMIT 10`,
      [orgId, from, to],
    );
    return res.json(rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Dashboard activity error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const dashboardRoutes = router;
