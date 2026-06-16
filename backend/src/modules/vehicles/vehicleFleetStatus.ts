import type { QueryResultRow } from "pg";

const TERMINAL_STATUSES = new Set(["maintenance", "sold", "scrapped"]);

export type FleetStatus = "available" | "rented";

export type FleetStatusInput = {
  status: string;
  currentDriverId: string | null;
  hasOpenRentalBooking: boolean;
};

type Queryable = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: T[] }>;
};

/** Returns the fleet status vehicles should use, or null when status must not change. */
export function resolveFleetStatus(input: FleetStatusInput): FleetStatus | null {
  if (TERMINAL_STATUSES.has(input.status)) {
    return null;
  }
  if (input.currentDriverId) {
    return "rented";
  }
  if (input.hasOpenRentalBooking) {
    return "rented";
  }
  return "available";
}

export async function syncVehicleFleetStatus(
  db: Queryable,
  orgId: string,
  vehicleId: string,
): Promise<void> {
  const { rows } = await db.query<{ status: string; current_driver_id: string | null }>(
    `SELECT status, current_driver_id::text
     FROM vehicles
     WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [vehicleId, orgId],
  );
  const vehicle = rows[0];
  if (!vehicle) return;
  if (TERMINAL_STATUSES.has(vehicle.status)) return;

  const nextStatus = await resolveFleetStatusForVehicle(db, orgId, vehicleId, vehicle);
  if (!nextStatus || nextStatus === vehicle.status) return;

  await db.query(
    `UPDATE vehicles SET status = $3, updated_at = NOW()
     WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [vehicleId, orgId, nextStatus],
  );
}

async function resolveFleetStatusForVehicle(
  db: Queryable,
  orgId: string,
  vehicleId: string,
  vehicle: { status: string; current_driver_id: string | null },
): Promise<FleetStatus | null> {
  const { rows: bookingRows } = await db.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM rental_bookings
       WHERE vehicle_id = $1::uuid AND organization_id = $2::uuid
         AND status IN ('confirmed', 'active')
     ) AS exists`,
    [vehicleId, orgId],
  );

  return resolveFleetStatus({
    status: vehicle.status,
    currentDriverId: vehicle.current_driver_id,
    hasOpenRentalBooking: bookingRows[0]?.exists ?? false,
  });
}
