import type { PoolClient } from "pg";
import type { CustomFeeType } from "./driverPayoutCustomFees";

export type RecurringFeeRow = {
  id: string;
  fee_name: string;
  fee_type: CustomFeeType;
  amount: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

/** Payout week overlaps recurring fee window and fee is active. */
export function feeAppliesToPayoutPeriod(
  fee: { is_active: boolean; start_date: string | null; end_date: string | null },
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

export const RECURRING_OVERLAP_SQL = `
  rf.is_active = true
  AND ($3::date <= COALESCE(rf.end_date, $4::date))
  AND ($4::date >= COALESCE(rf.start_date, $3::date))`;

export async function listRecurringFeesForDriver(
  client: PoolClient,
  orgId: string,
  driverId: string,
): Promise<RecurringFeeRow[]> {
  const { rows } = await client.query<RecurringFeeRow>(
    `SELECT id::text, fee_name, fee_type, amount::text, is_active,
            start_date::text, end_date::text, notes,
            created_at::text, updated_at::text
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
    `SELECT id::text, fee_name, fee_type, amount::text, is_active,
            start_date::text, end_date::text, notes,
            created_at::text, updated_at::text
     FROM driver_recurring_fees rf
     WHERE rf.organization_id = $1::uuid
       AND rf.driver_id = $2::uuid
       AND ${RECURRING_OVERLAP_SQL}
     ORDER BY rf.fee_name ASC, rf.id ASC`,
    [orgId, driverId, periodStart, periodEnd],
  );
  return rows;
}

/** Replace materialized recurring rows for one payout; leaves manual rows untouched. */
export async function syncRecurringFeesToPayout(
  client: PoolClient,
  orgId: string,
  payoutId: string,
): Promise<void> {
  const pr = await client.query<{
    driver_id: string;
    payment_period_start: string;
    payment_period_end: string;
  }>(
    `SELECT driver_id::text, payment_period_start::text, payment_period_end::text
     FROM driver_payouts
     WHERE id = $1::uuid AND organization_id = $2::uuid
     FOR UPDATE`,
    [payoutId, orgId],
  );
  const row = pr.rows[0];
  if (!row) return;

  await client.query(
    `DELETE FROM driver_payout_adjustments
     WHERE driver_payout_id = $1::uuid AND organization_id = $2::uuid AND source = 'recurring'`,
    [payoutId, orgId],
  );

  const active = await listActiveRecurringForPayoutPeriod(
    client,
    orgId,
    row.driver_id,
    row.payment_period_start.slice(0, 10),
    row.payment_period_end.slice(0, 10),
  );

  for (const fee of active) {
    await client.query(
      `INSERT INTO driver_payout_adjustments (
         driver_payout_id, organization_id, fee_name, fee_type, amount, source, recurring_fee_id
       ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, 'recurring', $6::uuid)`,
      [payoutId, orgId, fee.fee_name, fee.fee_type, Number(fee.amount), fee.id],
    );
  }
}

