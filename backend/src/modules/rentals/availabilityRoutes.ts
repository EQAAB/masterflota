import { Router } from "express";
import { query } from "../../db/pool";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const availabilityRoutes = Router();

availabilityRoutes.get("/", async (req, res) => {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  const vehicleId = typeof req.query.vehicleId === "string" ? req.query.vehicleId : undefined;
  if (!from || !to) return res.status(400).json({ message: "from and to query params required (YYYY-MM-DD)" });

  try {
    const params: unknown[] = [orgId, from, to];
    let vehicleFilter = "";
    if (vehicleId && UUID_RE.test(vehicleId)) {
      vehicleFilter = ` AND v.id = $4::uuid`;
      params.push(vehicleId);
    }

    const { rows: bookings } = await query(
      `SELECT b.id, b.booking_number, b.vehicle_id, b.start_at, b.end_at, b.status,
              c.legal_name AS customer_name
       FROM rental_bookings b
       JOIN rental_customers c ON c.id = b.customer_id
       WHERE b.organization_id = $1::uuid
         AND b.status NOT IN ('cancelled')
         AND b.end_at >= $2::timestamptz AND b.start_at <= $3::timestamptz
         ${vehicleId && UUID_RE.test(vehicleId) ? "AND b.vehicle_id = $4::uuid" : ""}
       ORDER BY b.start_at`,
      params,
    );

    const { rows: vehicles } = await query(
      `SELECT v.id, v.license_plate, v.make, v.model, v.status, v.current_driver_id IS NOT NULL AS driver_assigned
       FROM vehicles v
       WHERE v.organization_id = $1::uuid
         ${vehicleId && UUID_RE.test(vehicleId) ? "AND v.id = $2::uuid" : ""}
       ORDER BY v.license_plate`,
      vehicleId && UUID_RE.test(vehicleId) ? [orgId, vehicleId] : [orgId],
    );

    const { rows: blocks } = await query(
      `SELECT va.* FROM vehicle_availability va
       WHERE va.organization_id = $1::uuid
         AND va.avail_date >= $2::date AND va.avail_date <= $3::date
         ${vehicleId && UUID_RE.test(vehicleId) ? "AND va.vehicle_id = $4::uuid" : ""}`,
      params,
    );

    return res.json({ vehicles, bookings, availability: blocks });
  } catch (err) {
    console.error("Get availability error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});
