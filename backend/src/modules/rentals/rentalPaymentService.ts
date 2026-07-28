import type { QueryResultRow } from "pg";

export type RentalPaymentType = "rent" | "deposit" | "deposit_refund" | "extra" | "damage";
export type RentalPaymentStatus = "paid" | "pending" | "failed" | "refunded";
export type RentalPaymentMethod = "cash" | "online" | "other";

export type CreateRentalPaymentInput = {
  amount: number;
  paymentType?: RentalPaymentType;
  status?: RentalPaymentStatus;
  currency?: string;
  paidAt?: string | Date | null;
  method?: string | null;
  reference?: string | null;
  notes?: string | null;
};

type Db = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: T[] }>;
};

export function parseRentalPaymentType(value: unknown): RentalPaymentType {
  if (
    value === "deposit" ||
    value === "deposit_refund" ||
    value === "extra" ||
    value === "damage"
  ) {
    return value;
  }
  return "rent";
}

export function parseRentalPaymentStatus(value: unknown): RentalPaymentStatus {
  if (value === "paid" || value === "failed" || value === "refunded") {
    return value;
  }
  return "pending";
}

export function parseRentalPaymentMethod(value: unknown): RentalPaymentMethod {
  if (value == null || value === "") return "cash";
  const m = String(value).toLowerCase().trim();
  if (m === "cash") return "cash";
  if (m === "online") return "online";
  if (m === "other" || m === "any") return "other";
  if (
    m.includes("card") ||
    m.includes("stripe") ||
    m.includes("paypal") ||
    m.includes("bank") ||
    m.includes("transfer")
  ) {
    return "online";
  }
  return "other";
}

export async function createRentalPayment(
  db: Db,
  orgId: string,
  bookingId: string,
  input: CreateRentalPaymentInput,
): Promise<Record<string, unknown>> {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("amount required");
  }

  const { rows: booking } = await db.query<{ id: string }>(
    `SELECT id FROM rental_bookings WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [bookingId, orgId],
  );
  if (!booking[0]) {
    throw new Error("Booking not found");
  }

  const paymentType = input.paymentType ?? "rent";
  const status = input.status ?? "pending";
  const method = parseRentalPaymentMethod(input.method);

  const { rows } = await db.query<Record<string, unknown>>(
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
      input.currency ?? "RON",
      status,
      input.paidAt ?? null,
      method,
      input.reference ?? null,
      input.notes ?? null,
    ],
  );
  return rows[0]!;
}
