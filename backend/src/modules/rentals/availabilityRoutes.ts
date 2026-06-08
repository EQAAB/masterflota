import { Router } from "express";
import { query } from "../../db/pool";
import { requireOrgId } from "../../middleware/orgContext";
import { requireRentalsManage, requireRentalsView } from "./rentalAuth";
import { assertVehicleInOrg, RentalOrgScopeError } from "./rentalOrgGuards";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function eachDateInclusive(from: string, to: string): string[] {
  const dates: string[] = [];
  const d = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  while (d <= end) {
    dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dates;
}

export const availabilityRoutes = Router();

availabilityRoutes.get("/summary", requireRentalsView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  if (!from || !to) return res.status(400).json({ message: "from and to query params required (YYYY-MM-DD)" });

  try {
    const { rows } = await query(
      `SELECT
         (SELECT COUNT(*)::int FROM vehicles
          WHERE organization_id = $1 AND status = 'available') AS available_vehicles,
         (SELECT COUNT(*)::int FROM rental_bookings
          WHERE organization_id = $1 AND status = 'active') AS currently_rented,
         (SELECT COUNT(*)::int FROM rental_bookings b
          WHERE b.organization_id = $1 AND b.status = 'confirmed'
            AND b.start_at::date >= $2::date AND b.start_at::date <= $3::date) AS upcoming_bookings,
         (SELECT COUNT(*)::int FROM vehicle_availability va
          WHERE va.organization_id = $1 AND va.is_available = false
            AND va.avail_date >= $2::date AND va.avail_date <= $3::date) AS blocked_days`,
      [orgId, from, to],
    );
    return res.json(rows[0]);
  } catch (err) {
    console.error("Availability summary error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

availabilityRoutes.post("/blocks", requireRentalsManage, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const b = req.body as Record<string, unknown>;
  const vehicleId = typeof b.vehicleId === "string" ? b.vehicleId : "";
  const from = typeof b.from === "string" ? b.from : "";
  const to = typeof b.to === "string" ? b.to : "";
  const notes = typeof b.notes === "string" ? b.notes.trim() : null;
  if (!UUID_RE.test(vehicleId)) return res.status(400).json({ message: "Invalid vehicleId" });
  if (!from || !to || from > to) return res.status(400).json({ message: "from and to required (YYYY-MM-DD)" });

  try {
    await assertVehicleInOrg(vehicleId, orgId);
    const startAt = new Date(`${from}T00:00:00.000Z`);
    const endAt = new Date(`${to}T23:59:59.999Z`);
    const { rows: overlaps } = await query<{ booking_number: string }>(
      `SELECT booking_number FROM rental_bookings b
       WHERE b.vehicle_id = $1::uuid AND b.organization_id = $2::uuid
         AND b.status NOT IN ('cancelled', 'completed')
         AND b.start_at < $4::timestamptz AND b.end_at > $3::timestamptz
       LIMIT 1`,
      [vehicleId, orgId, startAt, endAt],
    );
    if (overlaps[0]) {
      return res.status(409).json({
        message: `Overlaps existing booking ${overlaps[0].booking_number}`,
      });
    }

    const dates = eachDateInclusive(from, to);
    for (const dateStr of dates) {
      await query(
        `INSERT INTO vehicle_availability (organization_id, vehicle_id, avail_date, is_available, blocking_booking_id, notes)
         VALUES ($1::uuid, $2::uuid, $3::date, false, NULL, $4)
         ON CONFLICT (organization_id, vehicle_id, avail_date)
         DO UPDATE SET
           is_available = CASE WHEN vehicle_availability.blocking_booking_id IS NULL THEN false ELSE vehicle_availability.is_available END,
           notes = CASE WHEN vehicle_availability.blocking_booking_id IS NULL THEN COALESCE($4, vehicle_availability.notes) ELSE vehicle_availability.notes END,
           updated_at = NOW()`,
        [orgId, vehicleId, dateStr, notes],
      );
    }
    return res.status(201).json({ vehicleId, from, to, daysBlocked: dates.length });
  } catch (err) {
    if (err instanceof RentalOrgScopeError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error("Create availability block error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

availabilityRoutes.delete("/blocks", requireRentalsManage, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const vehicleId = typeof req.query.vehicleId === "string" ? req.query.vehicleId : "";
  const from = typeof req.query.from === "string" ? req.query.from : "";
  const to = typeof req.query.to === "string" ? req.query.to : "";
  if (!UUID_RE.test(vehicleId)) return res.status(400).json({ message: "Invalid vehicleId" });
  if (!from || !to) return res.status(400).json({ message: "from and to required (YYYY-MM-DD)" });

  try {
    await assertVehicleInOrg(vehicleId, orgId);
    await query(
      `UPDATE vehicle_availability
       SET is_available = true, notes = NULL, updated_at = NOW()
       WHERE organization_id = $1::uuid AND vehicle_id = $2::uuid
         AND avail_date >= $3::date AND avail_date <= $4::date
         AND blocking_booking_id IS NULL`,
      [orgId, vehicleId, from, to],
    );
    return res.status(204).send();
  } catch (err) {
    if (err instanceof RentalOrgScopeError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error("Clear availability blocks error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

availabilityRoutes.get("/", requireRentalsView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  const vehicleId = typeof req.query.vehicleId === "string" ? req.query.vehicleId : undefined;
  const customerId = typeof req.query.customerId === "string" ? req.query.customerId : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
  const vehicleQ =
    typeof req.query.vehicleQ === "string"
      ? req.query.vehicleQ.trim()
      : typeof req.query.q === "string"
        ? req.query.q.trim()
        : undefined;
  if (!from || !to) return res.status(400).json({ message: "from and to query params required (YYYY-MM-DD)" });

  try {
    const params: unknown[] = [orgId, from, to];
    let i = 4;
    let sql = `
      SELECT b.id, b.booking_number, b.vehicle_id, b.customer_id, b.start_at, b.end_at, b.status,
             b.total_amount, b.currency, b.created_at,
             c.legal_name AS customer_name,
             v.license_plate, v.make, v.model
      FROM rental_bookings b
      JOIN rental_customers c ON c.id = b.customer_id
      JOIN vehicles v ON v.id = b.vehicle_id
      WHERE b.organization_id = $1::uuid
        AND b.end_at >= $2::timestamptz AND b.start_at <= $3::timestamptz`;

    if (status) {
      sql += ` AND b.status = $${i}`;
      params.push(status);
      i++;
    } else {
      sql += ` AND b.status NOT IN ('cancelled')`;
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
    if (q && !vehicleQ) {
      sql += ` AND (
        b.booking_number ILIKE '%' || $${i} || '%'
        OR c.legal_name ILIKE '%' || $${i} || '%'
        OR v.license_plate ILIKE '%' || $${i} || '%'
      )`;
      params.push(q);
      i++;
    }

    sql += ` ORDER BY b.start_at`;

    const { rows: bookings } = await query(sql, params);

    const vehicleParams: unknown[] = [orgId];
    let vi = 2;
    let vehicleSql = `
      SELECT v.id, v.license_plate, v.make, v.model, v.status, v.vehicle_type, v.transmission, v.fuel_type,
             v.current_driver_id IS NOT NULL AS driver_assigned
      FROM vehicles v
      WHERE v.organization_id = $1::uuid AND v.status IN ('available', 'rented', 'maintenance')`;
    if (vehicleId && UUID_RE.test(vehicleId)) {
      vehicleSql += ` AND v.id = $${vi}::uuid`;
      vehicleParams.push(vehicleId);
      vi++;
    }
    if (vehicleQ) {
      vehicleSql += ` AND (
        v.license_plate ILIKE '%' || $${vi} || '%'
        OR v.make ILIKE '%' || $${vi} || '%'
        OR v.model ILIKE '%' || $${vi} || '%'
      )`;
      vehicleParams.push(vehicleQ);
      vi++;
    }
    vehicleSql += ` ORDER BY v.license_plate`;

    const { rows: vehicles } = await query(vehicleSql, vehicleParams);

    const blockParams: unknown[] = [orgId, from, to];
    let blockSql = `
      SELECT va.id, va.vehicle_id, va.avail_date, va.is_available, va.blocking_booking_id, va.notes
      FROM vehicle_availability va
      WHERE va.organization_id = $1::uuid
        AND va.avail_date >= $2::date AND va.avail_date <= $3::date`;
    if (vehicleId && UUID_RE.test(vehicleId)) {
      blockSql += ` AND va.vehicle_id = $4::uuid`;
      blockParams.push(vehicleId);
    }

    const { rows: blocks } = await query(blockSql, blockParams);

    return res.json({ vehicles, bookings, availability: blocks });
  } catch (err) {
    console.error("Get availability error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});
