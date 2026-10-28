import { Router } from "express";
import { authenticateJWT, requirePermission } from "../../middleware/auth";
import { hasAnyPermission } from "../auth/permissions";
import { requireEarningsOverview } from "../auth/earningsPermissions";
import { attachOrgContext, requireOrgId } from "../../middleware/orgContext";
import { query } from "../../db/pool";
import { handleRecentAssignments } from "../vehicles/vehicleAssignmentHistoryHandlers";
import { buildOpsDigestItems, narrateOpsDigest } from "../../lib/ai/opsDigest";
import { isAiEnabled } from "../../lib/ai/openaiClient";

const router = Router();

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const NOT_DELETED = `(is_deleted = false OR is_deleted IS NULL)`;
const DRIVER_NOT_DELETED = `(dr.is_deleted = false OR dr.is_deleted IS NULL)`;
const D_NOT_DELETED = `(d.is_deleted = false OR d.is_deleted IS NULL)`;

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

function canViewPayoutFinance(permissions: string[] | undefined): boolean {
  return hasAnyPermission(permissions ?? [], ["payouts.view", "payouts.view_all"]);
}

function canViewLoanFinance(permissions: string[] | undefined): boolean {
  return hasAnyPermission(permissions ?? [], ["drivers.view"]);
}

function canViewRentalAlerts(permissions: string[] | undefined): boolean {
  return hasAnyPermission(permissions ?? [], ["rentals.view", "rentals.manage"]);
}

function canViewCommissionFinance(permissions: string[] | undefined): boolean {
  return hasAnyPermission(permissions ?? [], ["payouts.view", "payouts.view_all", "reports.view"]);
}

type DashboardStatsPayload = {
  totalDrivers: number;
  activeDrivers: number;
  pendingDocuments: number;
  expiredDocuments: number;
  totalVehicles: number;
  assignedVehicles: number;
  totalCommissionEarned: number | null;
  pendingPayments: number | null;
  totalVehicleRentalFees: number | null;
  pendingPayoutRows: number | null;
  outstandingDebt: number | null;
  driversWithDebt: number | null;
  outstandingLoans: number | null;
  driversWithLoans: number | null;
  overdueRentals: number | null;
  alertCount: number;
  periodFrom: string;
  periodTo: string;
};

async function loadDashboardStats(
  orgId: string,
  from: string,
  to: string,
  permissions: string[] | undefined,
): Promise<DashboardStatsPayload> {
  const showPayoutFinance = canViewPayoutFinance(permissions);
  const showLoanFinance = canViewLoanFinance(permissions);
  const showRentalAlerts = canViewRentalAlerts(permissions);
  const showCommissionFinance = canViewCommissionFinance(permissions);

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
    pendingPayoutsCountRes,
    debtRes,
    loansRes,
    overdueRentalsRes,
  ] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM drivers WHERE organization_id = $1 AND ${NOT_DELETED}`,
      [orgId],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM drivers
       WHERE organization_id = $1 AND employment_status = 'active' AND ${NOT_DELETED}`,
      [orgId],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM driver_documents d
       JOIN drivers dr ON d.driver_id = dr.id
       WHERE dr.organization_id = $1 AND ${DRIVER_NOT_DELETED}
         AND d.is_verified = false`,
      [orgId],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM driver_documents d
       JOIN drivers dr ON d.driver_id = dr.id
       WHERE dr.organization_id = $1 AND ${DRIVER_NOT_DELETED}
         AND d.expiry_date IS NOT NULL AND d.expiry_date < CURRENT_DATE`,
      [orgId],
    ),
    query<{ count: string }>("SELECT COUNT(*) as count FROM vehicles WHERE organization_id = $1", [orgId]),
    query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM drivers
       WHERE organization_id = $1 AND current_vehicle_id IS NOT NULL
         AND ${NOT_DELETED}`,
      [orgId],
    ),
    showCommissionFinance
      ? query<{ total: string | null }>(
          `SELECT COALESCE(SUM(company_commission), 0)::text as total
       FROM driver_payouts
       WHERE organization_id = $1
         AND payment_status IN ('paid', 'approved')
         AND payment_period_start <= $3::date
         AND payment_period_end >= $2::date`,
          [orgId, from, to],
        )
      : Promise.resolve({ rows: [{ total: null }] }),
    showPayoutFinance
      ? query<{ total: string | null }>(
          `SELECT COALESCE(SUM(net_driver_payout), 0)::text as total
       FROM driver_payouts
       WHERE organization_id = $1
         AND payment_status = 'pending'
         AND payment_period_start <= $3::date
         AND payment_period_end >= $2::date`,
          [orgId, from, to],
        )
      : Promise.resolve({ rows: [{ total: null }] }),
    showPayoutFinance
      ? query<{ total: string | null }>(
          `SELECT COALESCE(SUM(vehicle_rental_fee), 0)::text as total
       FROM driver_payouts
       WHERE organization_id = $1
         AND payment_period_start <= $3::date
         AND payment_period_end >= $2::date`,
          [orgId, from, to],
        )
      : Promise.resolve({ rows: [{ total: null }] }),
    showPayoutFinance
      ? query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
       FROM driver_payouts
       WHERE organization_id = $1
         AND payment_status = 'pending'
         AND payment_period_start <= $3::date
         AND payment_period_end >= $2::date`,
          [orgId, from, to],
        )
      : Promise.resolve({ rows: [{ count: null }] }),
    showPayoutFinance
      ? query<{ total: string; drivers: string }>(
          `SELECT COALESCE(SUM(remaining_debt_amount), 0)::text AS total,
              COUNT(DISTINCT driver_id)::text AS drivers
       FROM driver_payouts
       WHERE organization_id = $1 AND COALESCE(remaining_debt_amount, 0) > 0`,
          [orgId],
        )
      : Promise.resolve({ rows: [{ total: null, drivers: null }] }),
    showLoanFinance
      ? query<{ total: string; drivers: string }>(
          `SELECT COALESCE(SUM(remaining_balance), 0)::text AS total,
              COUNT(DISTINCT driver_id)::text AS drivers
       FROM driver_loans
       WHERE organization_id = $1
         AND status = 'active'
         AND COALESCE(remaining_balance, 0) > 0`,
          [orgId],
        )
      : Promise.resolve({ rows: [{ total: null, drivers: null }] }),
    showRentalAlerts
      ? query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
       FROM rental_bookings
       WHERE organization_id = $1
         AND status = 'active'
         AND end_at < NOW()`,
          [orgId],
        )
      : Promise.resolve({ rows: [{ count: null }] }),
  ]);

  const outstandingDebt = showPayoutFinance
    ? parseFloat(debtRes.rows[0]?.total ?? "0")
    : null;
  const driversWithDebt = showPayoutFinance
    ? parseInt(debtRes.rows[0]?.drivers ?? "0", 10)
    : null;
  const outstandingLoans = showLoanFinance
    ? parseFloat(loansRes.rows[0]?.total ?? "0")
    : null;
  const driversWithLoans = showLoanFinance
    ? parseInt(loansRes.rows[0]?.drivers ?? "0", 10)
    : null;
  const overdueRentals = showRentalAlerts
    ? parseInt(overdueRentalsRes.rows[0]?.count ?? "0", 10)
    : null;
  const pendingDocuments = parseInt(pendingDocsRes.rows[0]?.count ?? "0", 10);
  const expiredDocuments = parseInt(expiredDocsRes.rows[0]?.count ?? "0", 10);
  const pendingPayoutRows = showPayoutFinance
    ? parseInt(pendingPayoutsCountRes.rows[0]?.count ?? "0", 10)
    : null;

  const alertCount =
    (showPayoutFinance && (outstandingDebt ?? 0) > 0 ? 1 : 0) +
    (showLoanFinance && (outstandingLoans ?? 0) > 0 ? 1 : 0) +
    (showRentalAlerts && (overdueRentals ?? 0) > 0 ? 1 : 0) +
    (expiredDocuments > 0 ? 1 : 0) +
    (pendingDocuments > 0 ? 1 : 0) +
    (showPayoutFinance && (pendingPayoutRows ?? 0) > 0 ? 1 : 0);

  return {
    totalDrivers: parseInt(driversRes.rows[0]?.count ?? "0", 10),
    activeDrivers: parseInt(activeRes.rows[0]?.count ?? "0", 10),
    pendingDocuments,
    expiredDocuments,
    totalVehicles: parseInt(vehiclesRes.rows[0]?.count ?? "0", 10),
    assignedVehicles: parseInt(assignedVehiclesRes.rows[0]?.count ?? "0", 10),
    totalCommissionEarned: showCommissionFinance
      ? parseFloat(totalCommissionRes.rows[0]?.total ?? "0")
      : null,
    pendingPayments: showPayoutFinance
      ? parseFloat(pendingPaymentsRes.rows[0]?.total ?? "0")
      : null,
    totalVehicleRentalFees: showPayoutFinance
      ? parseFloat(vehicleRentalFeesRes.rows[0]?.total ?? "0")
      : null,
    pendingPayoutRows,
    outstandingDebt,
    driversWithDebt,
    outstandingLoans,
    driversWithLoans,
    overdueRentals,
    alertCount,
    periodFrom: from,
    periodTo: to,
  };
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
    const stats = await loadDashboardStats(orgId, from, to, req.user?.permissions);
    return res.json(stats);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Dashboard stats error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/ops-digest", async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const period = parsePeriodQuery(req);
  if ("error" in period) {
    return res.status(400).json({ message: period.error });
  }
  const { from, to } = period;

  try {
    const stats = await loadDashboardStats(orgId, from, to, req.user?.permissions);
    const items = buildOpsDigestItems({
      pendingDocuments: stats.pendingDocuments,
      expiredDocuments: stats.expiredDocuments,
      pendingPayoutRows: stats.pendingPayoutRows,
      pendingPayments: stats.pendingPayments,
      outstandingDebt: stats.outstandingDebt,
      driversWithDebt: stats.driversWithDebt,
      outstandingLoans: stats.outstandingLoans,
      driversWithLoans: stats.driversWithLoans,
      overdueRentals: stats.overdueRentals,
      periodFrom: from,
      periodTo: to,
    });

    let narrative: string | null = null;
    if (isAiEnabled() && items.length > 0) {
      try {
        narrative = await narrateOpsDigest(items, from, to);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Ops digest narrative error", err);
        narrative = null;
      }
    }

    return res.json({
      generatedAt: new Date().toISOString(),
      periodFrom: from,
      periodTo: to,
      aiEnabled: isAiEnabled(),
      items,
      narrative,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Dashboard ops-digest error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/platform-earnings", requireEarningsOverview, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const period = parsePeriodQuery(req);
  if ("error" in period) {
    return res.status(400).json({ message: period.error });
  }
  const { from, to } = period;

  try {
    const { rows } = await query<{
      platform: string;
      gross: string;
      commission: string;
      net_payout: string;
      row_count: string;
    }>(
      `SELECT COALESCE(platform, 'unknown')::text AS platform,
              COALESCE(SUM(total_gross_earnings), 0)::text AS gross,
              COALESCE(SUM(company_commission), 0)::text AS commission,
              COALESCE(SUM(net_driver_payout), 0)::text AS net_payout,
              COUNT(*)::text AS row_count
       FROM driver_payouts
       WHERE organization_id = $1
         AND payment_period_start <= $3::date
         AND payment_period_end >= $2::date
       GROUP BY platform
       ORDER BY SUM(COALESCE(total_gross_earnings, 0)) DESC`,
      [orgId, from, to],
    );

    return res.json({
      periodFrom: from,
      periodTo: to,
      platforms: rows.map((r) => ({
        platform: r.platform,
        gross: parseFloat(r.gross),
        commission: parseFloat(r.commission),
        netPayout: parseFloat(r.net_payout),
        rowCount: parseInt(r.row_count, 10),
      })),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Dashboard platform earnings error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/drivers/status", async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  try {
    const { rows } = await query<{ employment_status: string; count: string }>(
      `SELECT employment_status, COUNT(*)::text as count
       FROM drivers
       WHERE organization_id = $1 AND ${NOT_DELETED}
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
       WHERE dr.organization_id = $1 AND ${DRIVER_NOT_DELETED}
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
         AND ${D_NOT_DELETED}
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
