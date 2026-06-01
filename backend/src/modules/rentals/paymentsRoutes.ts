import { Router } from "express";
import { query } from "../../db/pool";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const paymentsRoutes = Router();

paymentsRoutes.get("/", async (req, res) => {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  try {
    const params: unknown[] = [orgId];
    let sql = `
      SELECT p.*, b.booking_number, c.legal_name AS customer_name
      FROM rental_payments p
      JOIN rental_bookings b ON b.id = p.booking_id
      JOIN rental_customers c ON c.id = b.customer_id
      WHERE p.organization_id = $1::uuid`;
    if (status) {
      sql += ` AND p.status = $2`;
      params.push(status);
    }
    sql += ` ORDER BY p.created_at DESC LIMIT 200`;
    const { rows } = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error("List rental payments error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

paymentsRoutes.get("/booking/:bookingId", async (req, res) => {
  const orgId = req.user?.orgId;
  const { bookingId } = req.params;
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

paymentsRoutes.post("/booking/:bookingId", async (req, res) => {
  const orgId = req.user?.orgId;
  const { bookingId } = req.params;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  if (!UUID_RE.test(bookingId)) return res.status(400).json({ message: "Invalid booking id" });
  const b = req.body as Record<string, unknown>;
  const amount = Number(b.amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: "amount required" });
  const paymentType =
    b.paymentType === "deposit" ||
    b.paymentType === "deposit_refund" ||
    b.paymentType === "extra" ||
    b.paymentType === "damage"
      ? b.paymentType
      : "rent";
  const status = b.status === "paid" || b.status === "failed" || b.status === "refunded" ? b.status : "pending";
  try {
    const { rows: booking } = await query(
      `SELECT id FROM rental_bookings WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [bookingId, orgId],
    );
    if (!booking[0]) return res.status(404).json({ message: "Booking not found" });

    const { rows } = await query(
      `INSERT INTO rental_payments (
         organization_id, booking_id, payment_type, amount, currency, status, paid_at, method, reference, notes
       ) VALUES ($1::uuid, $2::uuid, $3::varchar, $4, COALESCE($5::varchar, 'RON'), $6::varchar,
         CASE WHEN $6::varchar = 'paid' THEN COALESCE($7::timestamptz, NOW()) ELSE $7::timestamptz END,
         $8::varchar, $9::varchar, $10)
       RETURNING *`,
      [
        orgId,
        bookingId,
        paymentType,
        amount,
        b.currency ?? "RON",
        status,
        b.paidAt ?? null,
        b.method ?? null,
        b.reference ?? null,
        b.notes ?? null,
      ],
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Create rental payment error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

paymentsRoutes.patch("/:id", async (req, res) => {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  const b = req.body as Record<string, unknown>;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  try {
    const status = b.status === "paid" || b.status === "failed" || b.status === "refunded" ? b.status : undefined;
    const { rows } = await query(
      `UPDATE rental_payments SET
         status = COALESCE($3::varchar, status),
         paid_at = CASE WHEN $3::varchar = 'paid' THEN COALESCE($4::timestamptz, NOW()) ELSE paid_at END,
         method = COALESCE($5::varchar, method),
         reference = COALESCE($6::varchar, reference),
         notes = COALESCE($7, notes),
         updated_at = NOW()
       WHERE id = $1::uuid AND organization_id = $2::uuid
       RETURNING *`,
      [id, orgId, status ?? null, b.paidAt ?? null, b.method ?? null, b.reference ?? null, b.notes ?? null],
    );
    if (!rows[0]) return res.status(404).json({ message: "Payment not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("Update rental payment error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});
