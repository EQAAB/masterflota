import { query } from "../../db/pool";

export class VehicleDeleteBlockedError extends Error {
  readonly statusCode = 409;

  constructor(message: string) {
    super(message);
  }
}

export async function assertVehicleHasNoRentalBookings(
  vehicleId: string,
  orgId: string,
): Promise<void> {
  const { rows } = await query<{ n: number; numbers: string[] | null }>(
    `SELECT COUNT(*)::int AS n,
            array_agg(booking_number ORDER BY created_at DESC)
              FILTER (WHERE booking_number IS NOT NULL) AS numbers
     FROM rental_bookings
     WHERE vehicle_id = $1::uuid AND organization_id = $2::uuid`,
    [vehicleId, orgId],
  );

  const n = rows[0]?.n ?? 0;
  if (n <= 0) return;

  let message = `Cannot delete this vehicle because it has ${n} rental booking(s). Cancel or delete those bookings first.`;

  const numbers = rows[0]?.numbers?.filter(Boolean) ?? [];
  if (n <= 3 && numbers.length > 0) {
    message += ` Bookings: ${numbers.slice(0, n).join(", ")}.`;
  }

  throw new VehicleDeleteBlockedError(message);
}
