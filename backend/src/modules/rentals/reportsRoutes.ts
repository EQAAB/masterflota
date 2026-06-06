import { Router } from "express";
import { query } from "../../db/pool";
import { requireOrgId } from "../../middleware/orgContext";

export const reportsRoutes = Router();

reportsRoutes.get("/revenue", async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  const monthStart = from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = to ?? new Date().toISOString().slice(0, 10);

  try {
    const { rows: revenue } = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN payment_type = 'rent' AND status = 'paid' THEN amount ELSE 0 END), 0)::numeric AS rent_revenue,
         COALESCE(SUM(CASE WHEN payment_type = 'deposit' AND status = 'paid' THEN amount ELSE 0 END), 0)::numeric AS deposits_collected,
         COALESCE(SUM(CASE WHEN payment_type = 'damage' AND status = 'paid' THEN amount ELSE 0 END), 0)::numeric AS damage_charges,
         COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_count
       FROM rental_payments
       WHERE organization_id = $1::uuid
         AND paid_at >= $2::timestamptz AND paid_at < ($3::date + interval '1 day')`,
      [orgId, monthStart, monthEnd],
    );

    const { rows: bookingStats } = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active')::int AS active_bookings,
         COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed_bookings,
         COUNT(*) FILTER (WHERE status = 'active' AND end_at < NOW())::int AS overdue_bookings
       FROM rental_bookings
       WHERE organization_id = $1::uuid`,
      [orgId],
    );

    return res.json({
      period: { from: monthStart, to: monthEnd },
      revenue: revenue[0],
      bookings: bookingStats[0],
    });
  } catch (err) {
    console.error("Rental revenue report error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

reportsRoutes.get("/overdue", async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  try {
    const { rows } = await query(
      `SELECT b.*, c.legal_name AS customer_name, v.license_plate
       FROM rental_bookings b
       JOIN rental_customers c ON c.id = b.customer_id
       JOIN vehicles v ON v.id = b.vehicle_id
       WHERE b.organization_id = $1::uuid
         AND b.status = 'active'
         AND b.end_at < NOW()
       ORDER BY b.end_at ASC`,
      [orgId],
    );
    return res.json(rows);
  } catch (err) {
    console.error("Overdue rentals error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});
