import type { QueryResultRow } from "pg";
import { insertVehicleHistory } from "../vehicles/vehicleHistory";
import {
  checkVehicleAvailableForRental,
  clearAvailabilityForBooking,
  syncAvailabilityForBooking,
} from "./availabilityService";
import { resolvePricing } from "./pricingService";
import type { BookingStatus, RentalType } from "./rentalTypes";

type Db = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: T[] }>;
};

export async function nextBookingNumber(db: Db, orgId: string): Promise<string> {
  const { rows } = await db.query<{ n: number }>(
    `SELECT COUNT(*)::int + 1 AS n FROM rental_bookings WHERE organization_id = $1::uuid`,
    [orgId],
  );
  const seq = rows[0]?.n ?? 1;
  const year = new Date().getFullYear();
  return `RB-${year}-${String(seq).padStart(5, "0")}`;
}

export type BookingRow = {
  id: string;
  organization_id: string;
  booking_number: string;
  customer_id: string;
  vehicle_id: string;
  rental_type: RentalType;
  start_at: Date;
  end_at: Date;
  status: BookingStatus;
  subtotal: string;
  deposit_amount: string;
  total_amount: string;
  currency: string;
  mileage_out: number | null;
  mileage_in: number | null;
  damage_notes: string | null;
  damage_reported: boolean;
};

export async function loadBooking(
  db: Db,
  orgId: string,
  bookingId: string,
): Promise<BookingRow | null> {
  const { rows } = await db.query<BookingRow>(
    `SELECT * FROM rental_bookings WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [bookingId, orgId],
  );
  return rows[0] ?? null;
}

export async function confirmBooking(
  db: Db,
  orgId: string,
  bookingId: string,
  userId: string | undefined,
): Promise<BookingRow> {
  const booking = await loadBooking(db, orgId, bookingId);
  if (!booking) throw new Error("Booking not found");
  if (booking.status !== "draft") throw new Error("Only draft bookings can be confirmed");

  const startAt = new Date(booking.start_at);
  const endAt = new Date(booking.end_at);

  const conflict = await checkVehicleAvailableForRental(db, orgId, booking.vehicle_id, startAt, endAt, bookingId);
  if (conflict) throw new Error(conflict.message);

  const priced = await resolvePricing(
    db,
    orgId,
    booking.vehicle_id,
    booking.rental_type,
    startAt,
    endAt,
  );

  const { rows } = await db.query<BookingRow>(
    `UPDATE rental_bookings SET
       status = 'confirmed',
       pricing_snapshot = $3::jsonb,
       subtotal = $4,
       deposit_amount = $5,
       total_amount = $6,
       updated_at = NOW()
     WHERE id = $1::uuid AND organization_id = $2::uuid
     RETURNING *`,
    [
      bookingId,
      orgId,
      JSON.stringify(priced.snapshot),
      priced.subtotal,
      priced.deposit,
      priced.total,
    ],
  );
  const updated = rows[0]!;

  await syncAvailabilityForBooking(db, orgId, booking.vehicle_id, bookingId, startAt, endAt, true);

  await insertVehicleHistory(db, {
    orgId,
    vehicleId: booking.vehicle_id,
    eventType: "rental_booked",
    title: `Rental booked ${booking.booking_number}`,
    description: `Confirmed ${startAt.toISOString().slice(0, 10)} – ${endAt.toISOString().slice(0, 10)}`,
    metadata: { booking_id: bookingId, booking_number: booking.booking_number },
    createdBy: userId ?? null,
  });

  return updated;
}

export async function cancelBooking(
  db: Db,
  orgId: string,
  bookingId: string,
  reason: string | undefined,
  userId: string | undefined,
): Promise<BookingRow> {
  const booking = await loadBooking(db, orgId, bookingId);
  if (!booking) throw new Error("Booking not found");
  if (booking.status === "completed" || booking.status === "cancelled") {
    throw new Error("Cannot cancel this booking");
  }

  const { rows } = await db.query<BookingRow>(
    `UPDATE rental_bookings SET
       status = 'cancelled',
       cancelled_at = NOW(),
       cancellation_reason = $3,
       updated_at = NOW()
     WHERE id = $1::uuid AND organization_id = $2::uuid
     RETURNING *`,
    [bookingId, orgId, reason ?? null],
  );
  const updated = rows[0]!;

  await clearAvailabilityForBooking(db, orgId, booking.vehicle_id, bookingId);

  await insertVehicleHistory(db, {
    orgId,
    vehicleId: booking.vehicle_id,
    eventType: "rental_cancelled",
    title: `Rental cancelled ${booking.booking_number}`,
    description: reason ?? undefined,
    metadata: { booking_id: bookingId },
    createdBy: userId ?? null,
  });

  return updated;
}

export async function pickupBooking(
  db: Db,
  orgId: string,
  bookingId: string,
  mileageOut: number | undefined,
  userId: string | undefined,
): Promise<BookingRow> {
  const booking = await loadBooking(db, orgId, bookingId);
  if (!booking) throw new Error("Booking not found");
  if (booking.status !== "confirmed") throw new Error("Booking must be confirmed before pickup");

  const { rows: vRows } = await db.query<{ current_driver_id: string | null; status: string }>(
    `SELECT current_driver_id::text, status FROM vehicles WHERE id = $1::uuid`,
    [booking.vehicle_id],
  );
  if (vRows[0]?.current_driver_id) {
    throw new Error("Cannot pick up: vehicle is assigned to a driver");
  }

  const { rows } = await db.query<BookingRow>(
    `UPDATE rental_bookings SET
       status = 'active',
       actual_pickup_at = NOW(),
       mileage_out = COALESCE($3, mileage_out),
       updated_at = NOW()
     WHERE id = $1::uuid AND organization_id = $2::uuid
     RETURNING *`,
    [bookingId, orgId, mileageOut ?? null],
  );
  const updated = rows[0]!;

  await db.query(
    `UPDATE vehicles SET status = 'rented', updated_at = NOW()
     WHERE id = $1::uuid AND organization_id = $2::uuid AND current_driver_id IS NULL`,
    [booking.vehicle_id, orgId],
  );

  await insertVehicleHistory(db, {
    orgId,
    vehicleId: booking.vehicle_id,
    eventType: "rental_pickup",
    title: `Rental pickup ${booking.booking_number}`,
    odometerReading: mileageOut ?? null,
    newStatus: "rented",
    metadata: { booking_id: bookingId },
    createdBy: userId ?? null,
  });

  return updated;
}

export async function returnBooking(
  db: Db,
  orgId: string,
  bookingId: string,
  payload: { mileageIn?: number; damageNotes?: string; damageReported?: boolean },
  userId: string | undefined,
): Promise<BookingRow> {
  const booking = await loadBooking(db, orgId, bookingId);
  if (!booking) throw new Error("Booking not found");
  if (booking.status !== "active") throw new Error("Booking must be active before return");

  const { rows } = await db.query<BookingRow>(
    `UPDATE rental_bookings SET
       status = 'completed',
       actual_return_at = NOW(),
       mileage_in = COALESCE($3, mileage_in),
       damage_notes = COALESCE($4, damage_notes),
       damage_reported = COALESCE($5, damage_reported),
       updated_at = NOW()
     WHERE id = $1::uuid AND organization_id = $2::uuid
     RETURNING *`,
    [
      bookingId,
      orgId,
      payload.mileageIn ?? null,
      payload.damageNotes ?? null,
      payload.damageReported ?? false,
    ],
  );
  const updated = rows[0]!;

  await clearAvailabilityForBooking(db, orgId, booking.vehicle_id, bookingId);

  const { rows: vRows } = await db.query<{ current_driver_id: string | null }>(
    `SELECT current_driver_id::text FROM vehicles WHERE id = $1::uuid`,
    [booking.vehicle_id],
  );

  if (!vRows[0]?.current_driver_id) {
    await db.query(
      `UPDATE vehicles SET status = 'available', updated_at = NOW()
       WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [booking.vehicle_id, orgId],
    );
  }

  await insertVehicleHistory(db, {
    orgId,
    vehicleId: booking.vehicle_id,
    eventType: "rental_return",
    title: `Rental return ${booking.booking_number}`,
    odometerReading: payload.mileageIn ?? null,
    newStatus: vRows[0]?.current_driver_id ? undefined : "available",
    description: payload.damageReported ? payload.damageNotes ?? "Damage reported" : undefined,
    metadata: { booking_id: bookingId, damage_reported: payload.damageReported ?? false },
    createdBy: userId ?? null,
  });

  return updated;
}
