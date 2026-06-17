import { Router } from "express";
import { query } from "../../db/pool";
import { requireOrgId } from "../../middleware/orgContext";
import {
  createRentalPayment,
  parseRentalPaymentStatus,
  parseRentalPaymentType,
} from "./rentalPaymentService";
import { rentalDb } from "./rentalDb";
import { requireRentalsManage, requireRentalsView } from "./rentalAuth";
import {
  appendPaymentListFilters,
  parsePaymentListFilters,
  PAYMENT_LIST_JOINS,
} from "./paymentListFilters";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RENT_PAYMENT_STATE_SQL = `(SELECT CASE
  WHEN COALESCE(SUM(CASE WHEN p2.payment_type = 'rent' AND p2.status = 'paid' THEN p2.amount ELSE 0 END), 0)
       >= b.total_amount THEN 'paid'
  WHEN COALESCE(SUM(CASE WHEN p2.payment_type = 'rent' AND p2.status = 'paid' THEN p2.amount ELSE 0 END), 0) > 0
       THEN 'partial'
  ELSE 'unpaid'
END FROM rental_payments p2 WHERE p2.booking_id = b.id)`;

const PAYMENT_LIST_SELECT = `
  SELECT p.*, b.booking_number, b.start_at, b.end_at, b.total_amount AS booking_total,
         b.customer_id,
         c.legal_name AS customer_name, c.email AS customer_email,
         v.license_plate, v.make, v.model,
         ${RENT_PAYMENT_STATE_SQL} AS booking_payment_state
  FROM rental_payments p
  JOIN rental_bookings b ON b.id = p.booking_id
  JOIN rental_customers c ON c.id = b.customer_id
  JOIN vehicles v ON v.id = b.vehicle_id`;

export const paymentsRoutes = Router();

paymentsRoutes.get("/summary", requireRentalsView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const listFilters = parsePaymentListFilters(req.query as Record<string, unknown>);
  try {
    const { rows } = await query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)::numeric AS total_revenue,
         COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_count,
         COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_count,
         COALESCE(SUM(amount) FILTER (
           WHERE status = 'paid' AND paid_at >= date_trunc('month', NOW())
         ), 0)::numeric AS mtd_revenue,
         COALESCE(SUM(amount) FILTER (
           WHERE status = 'paid'
             AND paid_at >= date_trunc('month', NOW()) - interval '1 month'
             AND paid_at < date_trunc('month', NOW())
         ), 0)::numeric AS prev_mtd_revenue
       FROM rental_payments
       WHERE organization_id = $1`,
      [orgId],
    );
    const row = rows[0] as Record<string, unknown>;
    const mtd = Number(row.mtd_revenue ?? 0);
    const prev = Number(row.prev_mtd_revenue ?? 0);
    let revenue_trend_pct: number | null = null;
    if (prev > 0) revenue_trend_pct = Math.round(((mtd - prev) / prev) * 1000) / 10;

    const filteredParams: unknown[] = [orgId];
    let filteredSql = `SELECT
         COUNT(*)::int AS filtered_count,
         COALESCE(SUM(p.amount), 0)::numeric AS filtered_total_amount
       ${PAYMENT_LIST_JOINS}
       WHERE p.organization_id = $1::uuid`;
    filteredSql = appendPaymentListFilters(filteredSql, filteredParams, listFilters);
    const { rows: filteredRows } = await query(filteredSql, filteredParams);
    const filtered = filteredRows[0] as Record<string, unknown>;

    return res.json({
      total_revenue: Number(row.total_revenue ?? 0),
      paid_count: Number(row.paid_count ?? 0),
      pending_count: Number(row.pending_count ?? 0),
      mtd_revenue: mtd,
      revenue_trend_pct,
      filtered_count: Number(filtered.filtered_count ?? 0),
      filtered_total_amount: Number(filtered.filtered_total_amount ?? 0),
    });
  } catch (err) {
    console.error("Payments summary error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

paymentsRoutes.get("/activity", requireRentalsView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  try {
    const { rows } = await query(
      `${PAYMENT_LIST_SELECT}
       WHERE p.organization_id = $1::uuid
       ORDER BY p.created_at DESC
       LIMIT 10`,
      [orgId],
    );
    const items = rows.map((r: Record<string, unknown>) => {
      const status = String(r.status);
      let kind = "payment";
      let label = "Payment recorded";
      if (status === "paid") label = "Payment received";
      else if (status === "pending") label = "Payment pending";
      else if (status === "refunded") label = "Refund processed";
      else if (status === "failed") label = "Payment failed";
      if (r.payment_type === "deposit") label = status === "paid" ? "Deposit collected" : "Deposit pending";
      if (r.payment_type === "deposit_refund") label = "Deposit refund";
      return {
        id: r.id,
        kind,
        label,
        amount: r.amount,
        currency: r.currency,
        status,
        booking_number: r.booking_number,
        customer_name: r.customer_name,
        created_at: r.created_at,
      };
    });
    return res.json(items);
  } catch (err) {
    console.error("Payments activity error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

paymentsRoutes.get("/", requireRentalsView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const listFilters = parsePaymentListFilters(req.query as Record<string, unknown>);
  try {
    const params: unknown[] = [orgId];
    let sql = `${PAYMENT_LIST_SELECT} WHERE p.organization_id = $1::uuid`;
    sql = appendPaymentListFilters(sql, params, listFilters);
    sql += ` ORDER BY p.created_at DESC LIMIT 200`;
    const { rows } = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error("List rental payments error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

paymentsRoutes.get("/booking/:bookingId", requireRentalsView, async (req, res) => {
  const orgId = req.effectiveOrgId;
  const bookingId = String(req.params.bookingId ?? "");
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  try {
    const { rows } = await query(
      `SELECT * FROM rental_payments WHERE booking_id = $1::uuid AND organization_id = $2::uuid ORDER BY created_at`,
      [bookingId, orgId],
    );
    return res.json(rows);
  } catch (err) {
    console.error("List booking payments error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

paymentsRoutes.post("/booking/:bookingId", requireRentalsManage, async (req, res) => {
  const orgId = req.effectiveOrgId;
  const bookingId = String(req.params.bookingId ?? "");
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  if (!UUID_RE.test(bookingId)) return res.status(400).json({ message: "Invalid booking id" });
  const b = req.body as Record<string, unknown>;
  const amount = Number(b.amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: "amount required" });
  const paymentType = parseRentalPaymentType(b.paymentType);
  const status = parseRentalPaymentStatus(b.status);
  try {
    const row = await createRentalPayment(rentalDb, orgId, bookingId, {
      amount,
      paymentType,
      status,
      currency: typeof b.currency === "string" ? b.currency : "RON",
      paidAt: typeof b.paidAt === "string" ? b.paidAt : null,
      method: typeof b.method === "string" ? b.method : null,
      reference: typeof b.reference === "string" ? b.reference : null,
      notes: typeof b.notes === "string" ? b.notes : null,
    });
    return res.status(201).json(row);
  } catch (err) {
    if (err instanceof Error && err.message === "Booking not found") {
      return res.status(404).json({ message: err.message });
    }
    console.error("Create rental payment error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

paymentsRoutes.patch("/:id", requireRentalsManage, async (req, res) => {
  const orgId = req.effectiveOrgId;
  const id = String(req.params.id ?? "");
  const b = req.body as Record<string, unknown>;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  if (!UUID_RE.test(id)) return res.status(400).json({ message: "Invalid id" });
  try {
    const status =
      b.status === "paid" || b.status === "pending" || b.status === "failed" || b.status === "refunded"
        ? b.status
        : undefined;
    const paymentType =
      b.paymentType === "deposit" ||
      b.paymentType === "deposit_refund" ||
      b.paymentType === "extra" ||
      b.paymentType === "damage" ||
      b.paymentType === "rent"
        ? b.paymentType
        : undefined;
    const amount = b.amount != null ? Number(b.amount) : undefined;
    const { rows } = await query(
      `UPDATE rental_payments SET
         status = COALESCE($3::varchar, status),
         paid_at = CASE WHEN $3::varchar = 'paid' THEN COALESCE($4::timestamptz, NOW()) ELSE paid_at END,
         method = COALESCE($5::varchar, method),
         reference = COALESCE($6::varchar, reference),
         notes = COALESCE($7, notes),
         payment_type = COALESCE($8::varchar, payment_type),
         amount = COALESCE($9, amount),
         updated_at = NOW()
       WHERE id = $1::uuid AND organization_id = $2::uuid
       RETURNING *`,
      [
        id,
        orgId,
        status ?? null,
        b.paidAt ?? null,
        b.method ?? null,
        b.reference ?? null,
        b.notes ?? null,
        paymentType ?? null,
        amount != null && Number.isFinite(amount) ? amount : null,
      ],
    );
    if (!rows[0]) return res.status(404).json({ message: "Payment not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("Update rental payment error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});
