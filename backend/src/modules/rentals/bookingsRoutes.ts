import { Router } from "express";
import { query } from "../../db/pool";
import { requireOrgId } from "../../middleware/orgContext";
import { rentalDb } from "./rentalDb";
import { checkVehicleAvailableForRental } from "./availabilityService";
import {
  cancelBooking,
  confirmBooking,
  nextBookingNumber,
  pickupBooking,
  returnBooking,
} from "./bookingService";
import {
  mergeSnapshotWithFormMeta,
  parseFormMeta,
  quotePayload,
} from "./bookingFormMeta";
import { resolvePricing } from "./pricingService";
import type { RentalType } from "./rentalTypes";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const bookingsRoutes = Router();

bookingsRoutes.get("/", async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const vehicleId = typeof req.query.vehicleId === "string" ? req.query.vehicleId : undefined;
  const customerId = typeof req.query.customerId === "string" ? req.query.customerId : undefined;
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;

  try {
    const params: unknown[] = [orgId];
    let sql = `
      SELECT b.*,
             c.legal_name AS customer_name,
             c.customer_type,
             c.phone AS customer_phone,
             c.email AS customer_email,
             v.license_plate,
             v.make,
             v.model,
             (SELECT CASE
                WHEN COALESCE(SUM(CASE WHEN p.payment_type = 'rent' AND p.status = 'paid' THEN p.amount ELSE 0 END), 0)
                     >= b.total_amount THEN 'paid'
                WHEN COALESCE(SUM(CASE WHEN p.payment_type = 'rent' AND p.status = 'paid' THEN p.amount ELSE 0 END), 0) > 0
                     THEN 'partial'
                ELSE 'unpaid'
              END
              FROM rental_payments p
              WHERE p.booking_id = b.id) AS rent_payment_state
      FROM rental_bookings b
      JOIN rental_customers c ON c.id = b.customer_id
      JOIN vehicles v ON v.id = b.vehicle_id
      WHERE b.organization_id = $1::uuid`;
    let i = 2;
    if (status) {
      sql += ` AND b.status = $${i}`;
      params.push(status);
      i++;
    }
    if (vehicleId && UUID_RE.test(vehicleId)) {
      sql += ` AND b.vehicle_id = $${i}::uuid`;
      params.push(vehicleId);
      i++;
    }
    if (customerId && UUID_RE.test(customerId)) {
      sql += ` AND b.customer_id = $${i}::uuid`;
      params.push(customerId);
      i++;
    }
    if (from) {
      sql += ` AND b.end_at >= $${i}::timestamptz`;
      params.push(from);
      i++;
    }
    if (to) {
      sql += ` AND b.start_at <= $${i}::timestamptz`;
      params.push(to);
      i++;
    }
    if (q) {
      sql += ` AND (
        b.booking_number ILIKE '%' || $${i} || '%'
        OR c.legal_name ILIKE '%' || $${i} || '%'
        OR v.license_plate ILIKE '%' || $${i} || '%'
      )`;
      params.push(q);
      i++;
    }
    sql += ` ORDER BY b.start_at DESC`;
    const { rows } = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error("List rental bookings error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

bookingsRoutes.post("/quote", async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const b = req.body as Record<string, unknown>;
  const vehicleId = typeof b.vehicleId === "string" ? b.vehicleId : "";
  const rentalType = (b.rentalType === "weekly" || b.rentalType === "monthly" ? b.rentalType : "daily") as RentalType;
  const startAt = b.startAt ? new Date(String(b.startAt)) : null;
  const endAt = b.endAt ? new Date(String(b.endAt)) : null;
  if (!UUID_RE.test(vehicleId) || !startAt || !endAt || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return res.status(400).json({ message: "vehicleId, startAt, endAt required" });
  }
  try {
    const conflict = await checkVehicleAvailableForRental(rentalDb, orgId, vehicleId, startAt, endAt);
    const priced = await resolvePricing(rentalDb, orgId, vehicleId, rentalType, startAt, endAt);
    return res.json({
      ...quotePayload(priced),
      available: !conflict,
      conflict,
    });
  } catch (err) {
    console.error("Quote rental error", err);
    return res.status(500).json({ message: err instanceof Error ? err.message : "Internal server error" });
  }
});

bookingsRoutes.get("/:id", async (req, res) => {
  const orgId = req.effectiveOrgId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  if (!UUID_RE.test(id)) return res.status(400).json({ message: "Invalid id" });
  try {
    const { rows } = await query(
      `SELECT b.*,
              c.legal_name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
              v.license_plate, v.make, v.model, v.vehicle_type
       FROM rental_bookings b
       JOIN rental_customers c ON c.id = b.customer_id
       JOIN vehicles v ON v.id = b.vehicle_id
       WHERE b.id = $1::uuid AND b.organization_id = $2::uuid`,
      [id, orgId],
    );
    if (!rows[0]) return res.status(404).json({ message: "Booking not found" });
    const { rows: payments } = await query(
      `SELECT * FROM rental_payments WHERE booking_id = $1::uuid ORDER BY created_at`,
      [id],
    );
    return res.json({ ...rows[0], payments });
  } catch (err) {
    console.error("Get rental booking error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

bookingsRoutes.post("/", async (req, res) => {
  const orgId = req.effectiveOrgId;
  const userId = req.user?.sub;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  const b = req.body as Record<string, unknown>;
  const customerId = typeof b.customerId === "string" ? b.customerId : "";
  const vehicleId = typeof b.vehicleId === "string" ? b.vehicleId : "";
  const rentalType = (b.rentalType === "weekly" || b.rentalType === "monthly" ? b.rentalType : "daily") as RentalType;
  const startAt = b.startAt ? new Date(String(b.startAt)) : null;
  const endAt = b.endAt ? new Date(String(b.endAt)) : null;
  if (!UUID_RE.test(customerId) || !UUID_RE.test(vehicleId) || !startAt || !endAt) {
    return res.status(400).json({ message: "customerId, vehicleId, startAt, endAt required" });
  }
  try {
    const conflict = await checkVehicleAvailableForRental(rentalDb, orgId, vehicleId, startAt, endAt);
    if (conflict) return res.status(409).json({ message: conflict.message, code: conflict.code });

    const bookingNumber = await nextBookingNumber(rentalDb, orgId);
    const priced = await resolvePricing(rentalDb, orgId, vehicleId, rentalType, startAt, endAt);
    const formMeta = parseFormMeta(b);
    const snapshot = mergeSnapshotWithFormMeta(priced.snapshot, formMeta);

    const { rows } = await query(
      `INSERT INTO rental_bookings (
         organization_id, booking_number, customer_id, vehicle_id, rental_type,
         start_at, end_at, status, pricing_snapshot, subtotal, deposit_amount, total_amount, created_by
       ) VALUES ($1, $2, $3::uuid, $4::uuid, $5, $6, $7, 'draft', $8::jsonb, $9, $10, $11, $12::uuid)
       RETURNING *`,
      [
        orgId,
        bookingNumber,
        customerId,
        vehicleId,
        rentalType,
        startAt,
        endAt,
        JSON.stringify(snapshot),
        priced.subtotal,
        priced.deposit,
        priced.total,
        userId ?? null,
      ],
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Create rental booking error", err);
    return res.status(500).json({ message: err instanceof Error ? err.message : "Internal server error" });
  }
});

bookingsRoutes.put("/:id", async (req, res) => {
  const orgId = req.effectiveOrgId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  if (!UUID_RE.test(id)) return res.status(400).json({ message: "Invalid id" });
  const b = req.body as Record<string, unknown>;
  try {
    const { rows: existing } = await query<{
      status: string;
      vehicle_id: string;
      rental_type: RentalType;
      start_at: Date;
      end_at: Date;
      customer_id: string;
    }>(
      `SELECT status, vehicle_id::text, rental_type, start_at, end_at, customer_id::text
       FROM rental_bookings WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [id, orgId],
    );
    if (!existing[0]) return res.status(404).json({ message: "Booking not found" });
    if (existing[0].status !== "draft") {
      return res.status(400).json({ message: "Only draft bookings can be edited" });
    }

    const startAt = b.startAt ? new Date(String(b.startAt)) : undefined;
    const endAt = b.endAt ? new Date(String(b.endAt)) : undefined;
    const vehicleId =
      typeof b.vehicleId === "string" && UUID_RE.test(b.vehicleId)
        ? b.vehicleId
        : existing[0].vehicle_id;
    const rentalType = (
      b.rentalType === "weekly" || b.rentalType === "monthly"
        ? b.rentalType
        : b.rentalType === "daily"
          ? "daily"
          : existing[0].rental_type
    ) as RentalType;
    const finalStart = startAt ?? existing[0].start_at;
    const finalEnd = endAt ?? existing[0].end_at;

    const conflict = await checkVehicleAvailableForRental(
      rentalDb,
      orgId,
      vehicleId,
      finalStart,
      finalEnd,
      id,
    );
    if (conflict) return res.status(409).json({ message: conflict.message });

    const priced = await resolvePricing(rentalDb, orgId, vehicleId, rentalType, finalStart, finalEnd);
    const formMeta = parseFormMeta(b);
    const snapshot = mergeSnapshotWithFormMeta(priced.snapshot, formMeta);

    const customerId =
      typeof b.customerId === "string" && UUID_RE.test(b.customerId)
        ? b.customerId
        : existing[0].customer_id;

    const { rows } = await query(
      `UPDATE rental_bookings SET
         customer_id = $3::uuid,
         vehicle_id = $4::uuid,
         rental_type = $5,
         start_at = $6,
         end_at = $7,
         pricing_snapshot = $8::jsonb,
         subtotal = $9,
         deposit_amount = $10,
         total_amount = $11,
         updated_at = NOW()
       WHERE id = $1::uuid AND organization_id = $2::uuid AND status = 'draft'
       RETURNING *`,
      [
        id,
        orgId,
        customerId,
        vehicleId,
        rentalType,
        finalStart,
        finalEnd,
        JSON.stringify(snapshot),
        priced.subtotal,
        priced.deposit,
        priced.total,
      ],
    );
    if (!rows[0]) return res.status(404).json({ message: "Booking not found or not editable" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("Update rental booking error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

bookingsRoutes.post("/:id/confirm", async (req, res) => {
  const orgId = req.effectiveOrgId;
  const userId = req.user?.sub;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  try {
    const row = await confirmBooking(rentalDb, orgId, id, userId);
    return res.json(row);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return res.status(400).json({ message: msg });
  }
});

bookingsRoutes.post("/:id/cancel", async (req, res) => {
  const orgId = req.effectiveOrgId;
  const userId = req.user?.sub;
  const { id } = req.params;
  const reason = typeof (req.body as { reason?: string })?.reason === "string" ? (req.body as { reason: string }).reason : undefined;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  try {
    const row = await cancelBooking(rentalDb, orgId, id, reason, userId);
    return res.json(row);
  } catch (err) {
    return res.status(400).json({ message: err instanceof Error ? err.message : "Internal server error" });
  }
});

bookingsRoutes.post("/:id/pickup", async (req, res) => {
  const orgId = req.effectiveOrgId;
  const userId = req.user?.sub;
  const { id } = req.params;
  const mileageOut = typeof (req.body as { mileageOut?: number })?.mileageOut === "number"
    ? (req.body as { mileageOut: number }).mileageOut
    : undefined;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  try {
    const row = await pickupBooking(rentalDb, orgId, id, mileageOut, userId);
    return res.json(row);
  } catch (err) {
    return res.status(400).json({ message: err instanceof Error ? err.message : "Internal server error" });
  }
});

bookingsRoutes.post("/:id/return", async (req, res) => {
  const orgId = req.effectiveOrgId;
  const userId = req.user?.sub;
  const { id } = req.params;
  const body = req.body as { mileageIn?: number; damageNotes?: string; damageReported?: boolean };
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  try {
    const row = await returnBooking(rentalDb, orgId, id, body, userId);
    return res.json(row);
  } catch (err) {
    return res.status(400).json({ message: err instanceof Error ? err.message : "Internal server error" });
  }
});
