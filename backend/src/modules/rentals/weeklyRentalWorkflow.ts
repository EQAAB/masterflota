import type { PoolClient, QueryResultRow } from "pg";
import { pool } from "../../db/pool";
import { insertVehicleHistory } from "../vehicles/vehicleHistory";
import { syncVehicleFleetStatus } from "../vehicles/vehicleFleetStatus";
import { checkVehicleAvailableForRental, syncAvailabilityForBooking } from "./availabilityService";
import {
  confirmBooking,
  createDraftBooking,
  loadBooking,
  pickupBooking,
  type BookingRow,
} from "./bookingService";
import { assertRentalCustomerInOrg, assertVehicleInOrg } from "./rentalOrgGuards";
import { createRentalPayment } from "./rentalPaymentService";
import { resolvePricing } from "./pricingService";

type Db = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: T[] }>;
};

export type StartWeeklyRentalQuickInput = {
  customerId: string;
  vehicleId: string;
  startAt?: Date;
  endAt?: Date;
  paymentAmount?: number;
  recordPayment?: boolean;
  mileageOut?: number;
  skipPickup?: boolean;
};

export type RenewWeeklyBookingInput = {
  paymentAmount?: number;
  recordPayment?: boolean;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Mon→Sun pay week: pickup Monday + 6 calendar days = return Sunday. */
export const WEEKLY_RENTAL_SPAN_DAYS = 6;

/** Extend an active weekly rental by one more Mon→Sun week. */
export const WEEKLY_RENTAL_RENEWAL_DAYS = 7;

export function defaultWeeklyStartAt(): Date {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  if (d.getTime() < Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function weeklyRateFromSnapshot(snapshot: Record<string, unknown> | null | undefined): number {
  if (!snapshot) return 0;
  const weekly = Number(snapshot.weekly_rate ?? 0);
  return Number.isFinite(weekly) ? weekly : 0;
}

async function loadBookingWithPayments(
  db: Db,
  orgId: string,
  bookingId: string,
): Promise<Record<string, unknown>> {
  const { rows } = await db.query<Record<string, unknown>>(
    `SELECT b.*,
            c.legal_name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
            v.license_plate, v.make, v.model
     FROM rental_bookings b
     JOIN rental_customers c ON c.id = b.customer_id
     JOIN vehicles v ON v.id = b.vehicle_id
     WHERE b.id = $1::uuid AND b.organization_id = $2::uuid`,
    [bookingId, orgId],
  );
  const booking = rows[0];
  if (!booking) throw new Error("Booking not found");
  const { rows: payments } = await db.query(
    `SELECT * FROM rental_payments WHERE booking_id = $1::uuid ORDER BY created_at`,
    [bookingId],
  );
  return { ...booking, payments };
}

export async function startWeeklyRentalQuick(
  db: Db,
  orgId: string,
  userId: string | undefined,
  input: StartWeeklyRentalQuickInput,
): Promise<Record<string, unknown>> {
  await assertRentalCustomerInOrg(input.customerId, orgId, { requireActive: true });
  await assertVehicleInOrg(input.vehicleId, orgId);

  const startAt = input.startAt ?? defaultWeeklyStartAt();
  const endAt = input.endAt ?? addDays(startAt, WEEKLY_RENTAL_SPAN_DAYS);
  if (endAt <= startAt) {
    throw new Error("End date must be after start date");
  }

  const priced = await resolvePricing(db, orgId, input.vehicleId, "weekly", startAt, endAt);
  const paymentAmount = input.paymentAmount ?? priced.subtotal;
  const recordPayment = input.recordPayment !== false;
  const skipPickup = input.skipPickup === true;

  const draft = await createDraftBooking(db, orgId, userId, {
    customerId: input.customerId,
    vehicleId: input.vehicleId,
    rentalType: "weekly",
    startAt,
    endAt,
    pricingSnapshot: { weeks_renewed: 0 },
  });

  let booking = await confirmBooking(db, orgId, draft.id, userId);

  if (recordPayment && paymentAmount > 0) {
    await createRentalPayment(db, orgId, booking.id, {
      amount: paymentAmount,
      paymentType: "rent",
      status: "paid",
    });
  }

  if (!skipPickup) {
    booking = await pickupBooking(db, orgId, booking.id, input.mileageOut, userId);
  }

  return loadBookingWithPayments(db, orgId, booking.id);
}

export async function renewWeeklyBooking(
  db: Db,
  orgId: string,
  userId: string | undefined,
  bookingId: string,
  input: RenewWeeklyBookingInput = {},
): Promise<Record<string, unknown>> {
  const booking = await loadBooking(db, orgId, bookingId);
  if (!booking) throw new Error("Booking not found");
  if (booking.rental_type !== "weekly") {
    throw new Error("Only weekly bookings can be renewed with this action");
  }
  if (!["active", "confirmed"].includes(booking.status)) {
    throw new Error("Only active or confirmed weekly bookings can be renewed");
  }

  const currentEnd = new Date(booking.end_at);
  const newEndAt = addDays(currentEnd, WEEKLY_RENTAL_RENEWAL_DAYS);
  const extensionStart = currentEnd;

  const conflict = await checkVehicleAvailableForRental(
    db,
    orgId,
    booking.vehicle_id,
    extensionStart,
    newEndAt,
    bookingId,
  );
  if (conflict) throw new Error(conflict.message);

  const priced = await resolvePricing(
    db,
    orgId,
    booking.vehicle_id,
    "weekly",
    extensionStart,
    newEndAt,
  );
  const { rows: snapshotRows } = await db.query<{ pricing_snapshot: Record<string, unknown> }>(
    `SELECT pricing_snapshot FROM rental_bookings WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [bookingId, orgId],
  );
  const existingSnapshot = snapshotRows[0]?.pricing_snapshot ?? {};
  const weeksRenewed = Number(existingSnapshot.weeks_renewed ?? 0) + 1;
  const nextSnapshot = {
    ...existingSnapshot,
    ...priced.snapshot,
    weeks_renewed: weeksRenewed,
  };

  const newSubtotal = Math.round((Number(booking.subtotal) + priced.subtotal) * 100) / 100;
  const newTotal = Math.round((Number(booking.total_amount) + priced.total) * 100) / 100;
  const paymentAmount =
    input.paymentAmount ?? (weeklyRateFromSnapshot(nextSnapshot) || priced.subtotal);
  const recordPayment = input.recordPayment !== false;

  const { rows } = await db.query<BookingRow>(
    `UPDATE rental_bookings SET
       end_at = $3,
       subtotal = $4,
       total_amount = $5,
       pricing_snapshot = $6::jsonb,
       updated_at = NOW()
     WHERE id = $1::uuid AND organization_id = $2::uuid
     RETURNING *`,
    [bookingId, orgId, newEndAt, newSubtotal, newTotal, JSON.stringify(nextSnapshot)],
  );
  const updated = rows[0]!;

  await syncAvailabilityForBooking(
    db,
    orgId,
    booking.vehicle_id,
    bookingId,
    extensionStart,
    newEndAt,
    true,
  );

  if (recordPayment && paymentAmount > 0) {
    await createRentalPayment(db, orgId, bookingId, {
      amount: paymentAmount,
      paymentType: "rent",
      status: "paid",
      notes: `Weekly renewal ${weeksRenewed}`,
    });
  }

  await syncVehicleFleetStatus(db, orgId, booking.vehicle_id);

  await insertVehicleHistory(db, {
    orgId,
    vehicleId: booking.vehicle_id,
    eventType: "rental_renewed",
    title: `Rental renewed ${booking.booking_number}`,
    description: `Extended to ${newEndAt.toISOString().slice(0, 10)}`,
    metadata: { booking_id: bookingId, weeks_renewed: weeksRenewed },
    createdBy: userId ?? null,
  });

  return loadBookingWithPayments(db, orgId, updated.id);
}

export async function runStartWeeklyRentalQuick(
  orgId: string,
  userId: string | undefined,
  input: StartWeeklyRentalQuickInput,
): Promise<Record<string, unknown>> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await startWeeklyRentalQuick(client as PoolClient, orgId, userId, input);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function runRenewWeeklyBooking(
  orgId: string,
  userId: string | undefined,
  bookingId: string,
  input: RenewWeeklyBookingInput = {},
): Promise<Record<string, unknown>> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await renewWeeklyBooking(client as PoolClient, orgId, userId, bookingId, input);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
