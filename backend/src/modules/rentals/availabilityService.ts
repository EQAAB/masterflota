import type { QueryResultRow } from "pg";

type Db = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: T[] }>;
};

export type AvailabilityConflict = {
  code: "booking_overlap" | "driver_assigned" | "vehicle_unavailable";
  message: string;
};

export async function checkVehicleAvailableForRental(
  db: Db,
  orgId: string,
  vehicleId: string,
  startAt: Date,
  endAt: Date,
  excludeBookingId?: string,
): Promise<AvailabilityConflict | null> {
  const { rows: vRows } = await db.query<{ status: string; current_driver_id: string | null }>(
    `SELECT status, current_driver_id::text FROM vehicles
     WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [vehicleId, orgId],
  );
  const vehicle = vRows[0];
  if (!vehicle) {
    return { code: "vehicle_unavailable", message: "Vehicle not found" };
  }
  if (["maintenance", "sold", "scrapped"].includes(vehicle.status)) {
    return { code: "vehicle_unavailable", message: `Vehicle is ${vehicle.status}` };
  }

  const overlapParams: unknown[] = [vehicleId, orgId, startAt, endAt];
  let excludeSql = "";
  if (excludeBookingId) {
    excludeSql = " AND b.id <> $5::uuid";
    overlapParams.push(excludeBookingId);
  }

  const { rows: overlaps } = await db.query<{ booking_number: string }>(
    `SELECT booking_number FROM rental_bookings b
     WHERE b.vehicle_id = $1::uuid AND b.organization_id = $2::uuid
       AND b.status NOT IN ('cancelled', 'completed')
       AND b.start_at < $4::timestamptz AND b.end_at > $3::timestamptz
       ${excludeSql}
     LIMIT 1`,
    overlapParams,
  );
  if (overlaps[0]) {
    return {
      code: "booking_overlap",
      message: `Overlaps existing booking ${overlaps[0].booking_number}`,
    };
  }

  if (vehicle.current_driver_id) {
    const { rows: assignRows } = await db.query<{ id: string }>(
      `SELECT 1 AS id FROM vehicle_assignment_history vah
       WHERE vah.vehicle_id = $1::uuid AND vah.unassigned_at IS NULL
       LIMIT 1`,
      [vehicleId],
    );
    if (assignRows[0]) {
      return {
        code: "driver_assigned",
        message: "Vehicle is assigned to a driver. Unassign before external rental or choose different dates.",
      };
    }
  }

  return null;
}

export async function syncAvailabilityForBooking(
  db: Db,
  orgId: string,
  vehicleId: string,
  bookingId: string,
  startAt: Date,
  endAt: Date,
  block: boolean,
): Promise<void> {
  const d = new Date(startAt);
  d.setUTCHours(0, 0, 0, 0);
  const end = new Date(endAt);
  end.setUTCHours(0, 0, 0, 0);

  while (d <= end) {
    const dateStr = d.toISOString().slice(0, 10);
    if (block) {
      await db.query(
        `INSERT INTO vehicle_availability (organization_id, vehicle_id, avail_date, is_available, blocking_booking_id)
         VALUES ($1::uuid, $2::uuid, $3::date, false, $4::uuid)
         ON CONFLICT (organization_id, vehicle_id, avail_date)
         DO UPDATE SET is_available = false, blocking_booking_id = $4::uuid, updated_at = NOW()`,
        [orgId, vehicleId, dateStr, bookingId],
      );
    } else {
      await db.query(
        `UPDATE vehicle_availability
         SET is_available = true, blocking_booking_id = NULL, updated_at = NOW()
         WHERE organization_id = $1::uuid AND vehicle_id = $2::uuid AND avail_date = $3::date
           AND blocking_booking_id = $4::uuid`,
        [orgId, vehicleId, dateStr, bookingId],
      );
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

export async function clearAvailabilityForBooking(
  db: Db,
  orgId: string,
  vehicleId: string,
  bookingId: string,
): Promise<void> {
  await db.query(
    `UPDATE vehicle_availability
     SET is_available = true, blocking_booking_id = NULL, updated_at = NOW()
     WHERE organization_id = $1::uuid AND vehicle_id = $2::uuid AND blocking_booking_id = $3::uuid`,
    [orgId, vehicleId, bookingId],
  );
}
