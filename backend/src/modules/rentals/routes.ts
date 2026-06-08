import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth";
import { requireRentalsView } from "./rentalAuth";
import { attachOrgContext, requireOrgId } from "../../middleware/orgContext";
import { query } from "../../db/pool";
import { rentalDb } from "./rentalDb";
import { customersRoutes } from "./customersRoutes";
import { bookingsRoutes } from "./bookingsRoutes";
import { availabilityRoutes } from "./availabilityRoutes";
import { pricingRoutes } from "./pricingRoutes";
import { paymentsRoutes } from "./paymentsRoutes";
import { reportsRoutes } from "./reportsRoutes";
import { buildContractText } from "./contractPdf";

const router = Router();

router.use(authenticateJWT);
router.use(attachOrgContext);

router.use("/customers", customersRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/availability", availabilityRoutes);
router.use("/pricing", pricingRoutes);
router.use("/payments", paymentsRoutes);
router.use("/reports", reportsRoutes);

router.get("/dashboard", requireRentalsView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const { rows: stats } = await query(
      `SELECT
         (SELECT COUNT(*)::int FROM rental_bookings WHERE organization_id = $1 AND status = 'active') AS active_bookings,
         (SELECT COUNT(*)::int FROM rental_bookings WHERE organization_id = $1 AND status = 'confirmed') AS confirmed_bookings,
         (SELECT COUNT(*)::int FROM rental_customers WHERE organization_id = $1 AND is_active = true) AS active_customers,
         (SELECT COUNT(*)::int FROM rental_bookings WHERE organization_id = $1 AND status = 'active' AND end_at < NOW()) AS overdue_bookings`,
      [orgId],
    );

    const { rows: revRows } = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN paid_at >= $2::timestamptz THEN amount ELSE 0 END), 0)::numeric AS mtd_revenue,
         COALESCE(SUM(CASE WHEN paid_at >= $3::timestamptz AND paid_at < $2::timestamptz THEN amount ELSE 0 END), 0)::numeric AS prev_mtd_revenue
       FROM rental_payments
       WHERE organization_id = $1 AND payment_type = 'rent' AND status = 'paid'`,
      [orgId, monthStart, prevMonthStart],
    );

    const { rows: trendRows } = await query(
      `SELECT
         (SELECT COUNT(*)::int FROM rental_bookings
          WHERE organization_id = $1 AND status IN ('active', 'completed')
            AND actual_pickup_at >= date_trunc('week', NOW())) AS active_this_week,
         (SELECT COUNT(*)::int FROM rental_bookings
          WHERE organization_id = $1 AND status IN ('active', 'completed')
            AND actual_pickup_at >= date_trunc('week', NOW()) - interval '7 days'
            AND actual_pickup_at < date_trunc('week', NOW())) AS active_prev_week,
         (SELECT COUNT(*)::int FROM rental_bookings
          WHERE organization_id = $1 AND status IN ('confirmed', 'active', 'completed')
            AND created_at >= date_trunc('week', NOW())) AS confirmed_this_week,
         (SELECT COUNT(*)::int FROM rental_bookings
          WHERE organization_id = $1 AND status IN ('confirmed', 'active', 'completed')
            AND created_at >= date_trunc('week', NOW()) - interval '7 days'
            AND created_at < date_trunc('week', NOW())) AS confirmed_prev_week,
         (SELECT COUNT(*)::int FROM rental_customers
          WHERE organization_id = $1 AND created_at >= date_trunc('month', NOW())) AS customers_this_month,
         (SELECT COUNT(*)::int FROM rental_customers
          WHERE organization_id = $1 AND created_at >= date_trunc('month', NOW()) - interval '1 month'
            AND created_at < date_trunc('month', NOW())) AS customers_prev_month`,
      [orgId],
    );

    const { rows: weeklyRevenue } = await query(
      `SELECT
         to_char(date_trunc('week', paid_at), 'Mon DD') AS label,
         date_trunc('week', paid_at) AS week_start,
         COALESCE(SUM(amount), 0)::numeric AS amount
       FROM rental_payments
       WHERE organization_id = $1
         AND payment_type = 'rent'
         AND status = 'paid'
         AND paid_at >= date_trunc('week', NOW()) - interval '5 weeks'
       GROUP BY 1, 2
       ORDER BY week_start ASC`,
      [orgId],
    );

    const { rows: fleetRows } = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'available')::int AS available,
         COUNT(*) FILTER (WHERE status = 'rented')::int AS rented,
         COUNT(*) FILTER (WHERE status = 'maintenance')::int AS maintenance,
         COUNT(*)::int AS total
       FROM vehicles
       WHERE organization_id = $1 AND status IN ('available', 'rented', 'maintenance')`,
      [orgId],
    );

    const { rows: recentBookings } = await query(
      `SELECT b.id, b.booking_number, b.status, b.start_at, b.end_at, b.total_amount, b.currency,
              c.legal_name AS customer_name, v.license_plate, v.make, v.model
       FROM rental_bookings b
       JOIN rental_customers c ON c.id = b.customer_id
       JOIN vehicles v ON v.id = b.vehicle_id
       WHERE b.organization_id = $1
       ORDER BY b.updated_at DESC
       LIMIT 6`,
      [orgId],
    );

    const { rows: recentCustomers } = await query(
      `SELECT c.id, c.legal_name, c.customer_type,
              COUNT(b.id)::int AS booking_count,
              BOOL_OR(b.status IN ('active', 'confirmed')) AS has_active_booking
       FROM rental_customers c
       LEFT JOIN rental_bookings b ON b.customer_id = c.id AND b.organization_id = c.organization_id
       WHERE c.organization_id = $1 AND c.is_active = true
       GROUP BY c.id, c.legal_name, c.customer_type
       ORDER BY MAX(b.updated_at) DESC NULLS LAST, c.created_at DESC
       LIMIT 6`,
      [orgId],
    );

    const { rows: upcomingPayments } = await query(
      `SELECT p.id, p.booking_id, p.amount, p.currency, p.status, p.payment_type,
              b.booking_number, b.end_at AS due_at, c.legal_name AS customer_name
       FROM rental_payments p
       JOIN rental_bookings b ON b.id = p.booking_id
       JOIN rental_customers c ON c.id = b.customer_id
       WHERE p.organization_id = $1 AND p.status = 'pending'
       ORDER BY b.end_at ASC NULLS LAST, p.created_at ASC
       LIMIT 8`,
      [orgId],
    );

    const { rows: calendarDays } = await query(
      `SELECT DISTINCT (d::date) AS booking_date
       FROM rental_bookings b,
       LATERAL generate_series(
         date_trunc('day', b.start_at)::date,
         date_trunc('day', b.end_at)::date,
         interval '1 day'
       ) AS d
       WHERE b.organization_id = $1
         AND b.status NOT IN ('cancelled', 'draft')
         AND b.start_at::date <= $3::date
         AND b.end_at::date >= $2::date`,
      [orgId, monthStart, monthEnd],
    );

    const mtd = Number(revRows[0]?.mtd_revenue ?? 0);
    const prevMtd = Number(revRows[0]?.prev_mtd_revenue ?? 0);
    const revenueMomPct = prevMtd > 0 ? Math.round(((mtd - prevMtd) / prevMtd) * 1000) / 10 : null;
    const t = trendRows[0] ?? {};

    return res.json({
      ...stats[0],
      mtd_revenue: mtd,
      trends: {
        active_week_delta: Number(t.active_this_week ?? 0) - Number(t.active_prev_week ?? 0),
        confirmed_week_delta: Number(t.confirmed_this_week ?? 0) - Number(t.confirmed_prev_week ?? 0),
        customers_month_delta: Number(t.customers_this_month ?? 0) - Number(t.customers_prev_month ?? 0),
        revenue_mom_pct: revenueMomPct,
      },
      weekly_revenue: weeklyRevenue.map((w) => ({
        label: w.label,
        amount: Number(w.amount),
      })),
      fleet: fleetRows[0] ?? { available: 0, rented: 0, maintenance: 0, total: 0 },
      recent_bookings: recentBookings,
      recent_customers: recentCustomers.map((c) => ({
        id: c.id,
        legal_name: c.legal_name,
        customer_type: c.customer_type,
        booking_count: c.booking_count,
        has_active_booking: c.has_active_booking,
      })),
      upcoming_payments: upcomingPayments,
      calendar_days: calendarDays.map((d) => d.booking_date),
    });
  } catch (err) {
    console.error("Rental dashboard error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/bookings/:id/contract", requireRentalsView, async (req, res) => {
  const orgId = req.effectiveOrgId;
  const id = String(req.params.id ?? "");
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  try {
    const text = await buildContractText(rentalDb, orgId, id);
    if (!text) return res.status(404).json({ message: "Booking not found" });
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="contract-${id}.txt"`);
    return res.send(text);
  } catch (err) {
    console.error("Contract export error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const rentalRoutes = router;
