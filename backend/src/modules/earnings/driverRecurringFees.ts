import type { PoolClient } from "pg";
import type { CustomFeeType } from "./driverPayoutCustomFees";

export type RecurringFeeFrequency =
  | "weekly"
  | "monthly_first_week"
  | "monthly_last_week"
  | "one_time";

/** Frequencies implemented in application logic (others reserved in DB). */
export const SUPPORTED_RECURRING_FREQUENCIES = new Set<RecurringFeeFrequency>([
  "weekly",
  "monthly_first_week",
]);

export type RecurringFeeRow = {
  id: string;
  fee_name: string;
  fee_type: CustomFeeType;
  amount: string;
  frequency: RecurringFeeFrequency;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RecurringFeeForPeriodCheck = {
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  frequency: RecurringFeeFrequency;
};

function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** True when periodStart <= day 1 of some calendar month <= periodEnd. */
export function periodContainsFirstOfMonth(periodStart: string, periodEnd: string): boolean {
  const start = parseDateOnly(periodStart);
  const end = parseDateOnly(periodEnd);
  if (start > end) return false;

  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

  while (cursor <= endMonth) {
    const firstOfMonth = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1));
    if (firstOfMonth >= start && firstOfMonth <= end) return true;
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
  return false;
}

/** Date overlap only (ignores frequency). */
export function feeOverlapsPayoutPeriod(
  fee: Pick<RecurringFeeForPeriodCheck, "is_active" | "start_date" | "end_date">,
  periodStart: string,
  periodEnd: string,
): boolean {
  if (!fee.is_active) return false;
  const start = periodStart.slice(0, 10);
  const end = periodEnd.slice(0, 10);
  const feeStart = fee.start_date?.slice(0, 10) ?? start;
  const feeEnd = fee.end_date?.slice(0, 10) ?? end;
  return start <= feeEnd && end >= feeStart;
}

/** Whether a recurring fee should materialize on this payout week. */
export function recurringFeeAppliesToPayoutPeriod(
  fee: RecurringFeeForPeriodCheck,
  periodStart: string,
  periodEnd: string,
): boolean {
  if (!feeOverlapsPayoutPeriod(fee, periodStart, periodEnd)) return false;

  switch (fee.frequency) {
    case "weekly":
      return true;
    case "monthly_first_week":
      return periodContainsFirstOfMonth(periodStart, periodEnd);
    case "monthly_last_week":
    case "one_time":
      return false;
    default:
      return false;
  }
}

/** @deprecated Use recurringFeeAppliesToPayoutPeriod */
export function feeAppliesToPayoutPeriod(
  fee: RecurringFeeForPeriodCheck,
  periodStart: string,
  periodEnd: string,
): boolean {
  return recurringFeeAppliesToPayoutPeriod(fee, periodStart, periodEnd);
}

export const RECURRING_OVERLAP_SQL = `
  rf.is_active = true
  AND ($3::date <= COALESCE(rf.end_date, $4::date))
  AND ($4::date >= COALESCE(rf.start_date, $3::date))`;

const RECURRING_SELECT = `
  id::text, fee_name, fee_type, amount::text, frequency, is_active,
  start_date::text, end_date::text, notes,
  created_at::text, updated_at::text`;

export async function listRecurringFeesForDriver(
  client: PoolClient,
  orgId: string,
  driverId: string,
): Promise<RecurringFeeRow[]> {
  const { rows } = await client.query<RecurringFeeRow>(
    `SELECT ${RECURRING_SELECT}
     FROM driver_recurring_fees
     WHERE organization_id = $1::uuid AND driver_id = $2::uuid
     ORDER BY is_active DESC, fee_name ASC, id ASC`,
    [orgId, driverId],
  );
  return rows;
}

export async function listActiveRecurringForPayoutPeriod(
  client: PoolClient,
  orgId: string,
  driverId: string,
  periodStart: string,
  periodEnd: string,
): Promise<RecurringFeeRow[]> {
  const { rows } = await client.query<RecurringFeeRow>(
    `SELECT ${RECURRING_SELECT}
     FROM driver_recurring_fees rf
     WHERE rf.organization_id = $1::uuid
       AND rf.driver_id = $2::uuid
       AND ${RECURRING_OVERLAP_SQL}
     ORDER BY rf.fee_name ASC, rf.id ASC`,
    [orgId, driverId, periodStart, periodEnd],
  );
  const ps = periodStart.slice(0, 10);
  const pe = periodEnd.slice(0, 10);
  return rows.filter((fee) => recurringFeeAppliesToPayoutPeriod(fee, ps, pe));
}

export function parseRecurringFrequency(value: unknown): RecurringFeeFrequency | null {
  if (typeof value !== "string") return null;
  const f = value.trim() as RecurringFeeFrequency;
  if (
    f === "weekly" ||
    f === "monthly_first_week" ||
    f === "monthly_last_week" ||
    f === "one_time"
  ) {
    return f;
  }
  return null;
}

export function assertSupportedRecurringFrequency(
  frequency: RecurringFeeFrequency,
): { ok: true } | { ok: false; message: string } {
  if (SUPPORTED_RECURRING_FREQUENCIES.has(frequency)) return { ok: true };
  return {
    ok: false,
    message: `frequency "${frequency}" is not supported yet. Use weekly or monthly_first_week.`,
  };
}
