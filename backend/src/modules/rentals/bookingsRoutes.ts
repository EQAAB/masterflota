import { Router } from "express";
import { query } from "../../db/pool";
import { rentalDb } from "./rentalDb";
import { checkVehicleAvailableForRental } from "./availabilityService";
import {
  cancelBooking,
  confirmBooking,
  nextBookingNumber,
  pickupBooking,
  returnBooking,
} from "./bookingService";
import { resolvePricing } from "./pricingService";
import type { RentalType } from "./rentalTypes";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const bookingsRoutes = Router();

bookingsRoutes.get("/", async (req, res) => {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const vehicleId = typeof req.query.vehicleId === "string" ? req.query.vehicleId : undefined;
  const customerId = typeof req.query.customerId === "string" ? req.query.customerId : undefined;
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;

  try {
    const params: unknown[] = [orgId];
    let sql = `
      SELECT b.*,
             c.legal_name AS customer_name,
             c.customer_type,
             v.license_plate,
             v.make,
             v.model
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
    sql += ` ORDER BY b.start_at DESC`;
    const { rows } = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error("List rental bookings error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

bookingsRoutes.post("/quote", async (req, res) => {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
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
    return res.json({ ...priced, available: !conflict, conflict });
  } catch (err) {
    console.error("Quote rental error", err);
    return res.status(500).json({ message: err instanceof Error ? err.message : "Internal server error" });
  }
});

bookingsRoutes.get("/:id", async (req, res) => {
  const orgId = req.user?.orgId;
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
  const orgId = req.user?.orgId;
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
        JSON.stringify(priced.snapshot),
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
  const orgId = req.user?.orgId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  if (!UUID_RE.test(id)) return res.status(400).json({ message: "Invalid id" });
  const b = req.body as Record<string, unknown>;
  try {
    const { rows: existing } = await query<{ status: string; vehicle_id: string }>(
      `SELECT status, vehicle_id::text FROM rental_bookings WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [id, orgId],
    );
    if (!existing[0]) return res.status(404).json({ message: "Booking not found" });
    if (existing[0].status !== "draft") {
      return res.status(400).json({ message: "Only draft bookings can be edited" });
    }

    const startAt = b.startAt ? new Date(String(b.startAt)) : undefined;
    const endAt = b.endAt ? new Date(String(b.endAt)) : undefined;
    const vehicleId = typeof b.vehicleId === "string" ? b.vehicleId : existing[0].vehicle_id;
    const rentalType = (b.rentalType === "weekly" || b.rentalType === "monthly" ? b.rentalType : b.rentalType === "daily" ? "daily" : undefined) as RentalType | undefined;

    if (startAt && endAt) {
      const conflict = await checkVehicleAvailableForRental(rentalDb, orgId, vehicleId, startAt, endAt, id);
      if (conflict) return res.status(409).json({ message: conflict.message });
    }

    const { rows } = await query(
      `UPDATE rental_bookings SET
         customer_id = COALESCE($3::uuid, customer_id),
         vehicle_id = COALESCE($4::uuid, vehicle_id),
         rental_type = COALESCE($5, rental_type),
         start_at = COALESCE($6, start_at),
         end_at = COALESCE($7, end_at),
         updated_at = NOW()
       WHERE id = $1::uuid AND organization_id = $2::uuid AND status = 'draft'
       RETURNING *`,
      [
        id,
        orgId,
        b.customerId ?? null,
        b.vehicleId ?? null,
        rentalType ?? null,
        startAt ?? null,
        endAt ?? null,
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
  const orgId = req.user?.orgId;
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
  const orgId = req.user?.orgId;
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
  const orgId = req.user?.orgId;
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
  const orgId = req.user?.orgId;
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
