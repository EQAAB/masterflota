import type { PoolClient } from "pg";
import { listActiveRecurringForPayoutPeriod } from "./driverRecurringFees";
import type { CustomFeeType } from "./driverPayoutCustomFees";
import { roundMoney } from "./debtAllocation";

/** Anchor platform priority for weekly recurring fee deduction (first existing payout wins). */
export const WEEKLY_FEE_ANCHOR_PLATFORMS = ["glovo", "uber", "bolt_taxi", "bolt"] as const;

export type WeeklyFeeAnchorPlatform = (typeof WEEKLY_FEE_ANCHOR_PLATFORMS)[number];

export const WEEKLY_FEE_ANCHOR_PLATFORM_ORDER_SQL = `
  CASE dp.platform
    WHEN 'glovo' THEN 1
    WHEN 'uber' THEN 2
    WHEN 'bolt_taxi' THEN 3
    WHEN 'bolt' THEN 4
    ELSE 5
  END`;

/** Pick anchor platform from a list of payout platforms (pure, for tests). */
export function pickWeeklyFeeAnchorPlatform(platforms: string[]): string | null {
  for (const anchor of WEEKLY_FEE_ANCHOR_PLATFORMS) {
    if (platforms.includes(anchor)) return anchor;
  }
  return platforms[0] ?? null;
}

export async function selectWeeklyFeeAnchorPayoutId(
  client: PoolClient,
  orgId: string,
  driverId: string,
  periodStart: string,
  periodEnd: string,
): Promise<string | null> {
  const { rows } = await client.query<{ id: string }>(
    `SELECT dp.id::text
     FROM driver_payouts dp
     WHERE dp.organization_id = $1::uuid
       AND dp.driver_id = $2::uuid
       AND dp.payment_period_start = $3::date
       AND dp.payment_period_end = $4::date
     ORDER BY ${WEEKLY_FEE_ANCHOR_PLATFORM_ORDER_SQL}, dp.id
     LIMIT 1`,
    [orgId, driverId, periodStart.slice(0, 10), periodEnd.slice(0, 10)],
  );
  return rows[0]?.id ?? null;
}

export async function getWeeklyFeeAnchorPlatform(
  client: PoolClient,
  orgId: string,
  driverId: string,
  periodStart: string,
  periodEnd: string,
): Promise<string | null> {
  const { rows } = await client.query<{ platform: string }>(
    `SELECT dp.platform
     FROM driver_payouts dp
     WHERE dp.organization_id = $1::uuid
       AND dp.driver_id = $2::uuid
       AND dp.payment_period_start = $3::date
       AND dp.payment_period_end = $4::date
     ORDER BY ${WEEKLY_FEE_ANCHOR_PLATFORM_ORDER_SQL}, dp.id
     LIMIT 1`,
    [orgId, driverId, periodStart.slice(0, 10), periodEnd.slice(0, 10)],
  );
  return rows[0]?.platform ?? null;
}

/** Materialize active recurring fees once per driver/week in driver_weekly_fees. */
export async function syncRecurringFeesToDriverWeek(
  client: PoolClient,
  orgId: string,
  driverId: string,
  periodStart: string,
  periodEnd: string,
): Promise<void> {
  const ps = periodStart.slice(0, 10);
  const pe = periodEnd.slice(0, 10);

  await client.query(
    `DELETE FROM driver_weekly_fees
     WHERE organization_id = $1::uuid
       AND driver_id = $2::uuid
       AND payment_period_start = $3::date
       AND payment_period_end = $4::date`,
    [orgId, driverId, ps, pe],
  );

  const active = await listActiveRecurringForPayoutPeriod(client, orgId, driverId, ps, pe);
  for (const fee of active) {
    await client.query(
      `INSERT INTO driver_weekly_fees (
         organization_id, driver_id, payment_period_start, payment_period_end,
         recurring_fee_id, fee_name, fee_type, amount
       ) VALUES ($1::uuid, $2::uuid, $3::date, $4::date, $5::uuid, $6, $7, $8)`,
      [orgId, driverId, ps, pe, fee.id, fee.fee_name, fee.fee_type, Number(fee.amount)],
    );
  }
}

export type WeeklyFeeTotals = {
  deductions: number;
  additions: number;
};

export async function sumWeeklyRecurringFees(
  client: PoolClient,
  orgId: string,
  driverId: string,
  periodStart: string,
  periodEnd: string,
): Promise<WeeklyFeeTotals> {
  const { rows } = await client.query<{ deductions: string | null; additions: string | null }>(
    `SELECT
       COALESCE(SUM(CASE WHEN fee_type = 'deduction' THEN amount ELSE 0 END), 0)::text AS deductions,
       COALESCE(SUM(CASE WHEN fee_type = 'addition' THEN amount ELSE 0 END), 0)::text AS additions
     FROM driver_weekly_fees
     WHERE organization_id = $1::uuid
       AND driver_id = $2::uuid
       AND payment_period_start = $3::date
       AND payment_period_end = $4::date`,
    [orgId, driverId, periodStart.slice(0, 10), periodEnd.slice(0, 10)],
  );
  const row = rows[0];
  return {
    deductions: roundMoney(Number(row?.deductions ?? "0")),
    additions: roundMoney(Number(row?.additions ?? "0")),
  };
}

export type WeeklyRecurringFeeRow = {
  id: string;
  fee_name: string;
  fee_type: CustomFeeType;
  amount: string;
  recurring_fee_id: string;
  created_at: string;
};

export async function listWeeklyRecurringFeesForDriverWeek(
  client: PoolClient,
  orgId: string,
  driverId: string,
  periodStart: string,
  periodEnd: string,
): Promise<WeeklyRecurringFeeRow[]> {
  const { rows } = await client.query<WeeklyRecurringFeeRow>(
    `SELECT id::text, fee_name, fee_type, amount::text, recurring_fee_id::text, created_at::text
     FROM driver_weekly_fees
     WHERE organization_id = $1::uuid
       AND driver_id = $2::uuid
       AND payment_period_start = $3::date
       AND payment_period_end = $4::date
     ORDER BY fee_name ASC, id ASC`,
    [orgId, driverId, periodStart.slice(0, 10), periodEnd.slice(0, 10)],
  );
  return rows;
}

export async function listWeeklyRecurringFeesForPayout(
  client: PoolClient,
  orgId: string,
  payoutId: string,
): Promise<WeeklyRecurringFeeRow[]> {
  const pr = await client.query<{
    driver_id: string;
    payment_period_start: string;
    payment_period_end: string;
  }>(
    `SELECT driver_id::text, payment_period_start::text, payment_period_end::text
     FROM driver_payouts
     WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [payoutId, orgId],
  );
  const row = pr.rows[0];
  if (!row) return [];
  return listWeeklyRecurringFeesForDriverWeek(
    client,
    orgId,
    row.driver_id,
    row.payment_period_start,
    row.payment_period_end,
  );
}

/** Sum weekly recurring fee totals for settlement-style aggregation (once per driver/week). */
export function sumWeeklyFeeRows(rows: Pick<WeeklyRecurringFeeRow, "fee_type" | "amount">[]): WeeklyFeeTotals {
  let deductions = 0;
  let additions = 0;
  for (const row of rows) {
    const amount = roundMoney(Number(row.amount));
    if (row.fee_type === "deduction") deductions = roundMoney(deductions + amount);
    else additions = roundMoney(additions + amount);
  }
  return { deductions, additions };
}
