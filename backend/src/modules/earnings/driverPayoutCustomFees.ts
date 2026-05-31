import type { PoolClient } from "pg";
import { recomputeDriverDebtAllocation, roundMoney } from "./debtAllocation";
import {
  listWeeklyRecurringFeesForDriverWeek,
  selectWeeklyFeeAnchorPayoutId,
  sumWeeklyRecurringFees,
  syncRecurringFeesToDriverWeek,
} from "./driverWeeklyFees";

export type CustomFeeType = "deduction" | "addition";

export type DriverPayoutRawInputs = {
  total_net_earnings: number;
  company_commission: number;
  total_daily_cash: number;
  account_opening_fee: number;
  vehicle_rental_fee: number;
};

/** Earnings-derived raw net before custom fees (matches rent sync / rollup). */
export function computeBaseRawNet(row: DriverPayoutRawInputs): number {
  return roundMoney(
    row.total_net_earnings -
      row.company_commission -
      Math.abs(row.total_daily_cash) -
      Math.abs(row.account_opening_fee) -
      row.vehicle_rental_fee,
  );
}

export type CustomFeeTotals = {
  deductions: number;
  additions: number;
};

export async function sumManualCustomFees(client: PoolClient, payoutId: string): Promise<CustomFeeTotals> {
  const { rows } = await client.query<{ deductions: string | null; additions: string | null }>(
    `SELECT
       COALESCE(SUM(CASE WHEN fee_type = 'deduction' THEN amount ELSE 0 END), 0)::text AS deductions,
       COALESCE(SUM(CASE WHEN fee_type = 'addition' THEN amount ELSE 0 END), 0)::text AS additions
     FROM driver_payout_adjustments
     WHERE driver_payout_id = $1::uuid AND source = 'manual'`,
    [payoutId],
  );
  const row = rows[0];
  return {
    deductions: roundMoney(Number(row?.deductions ?? "0")),
    additions: roundMoney(Number(row?.additions ?? "0")),
  };
}

/** @deprecated Use sumManualCustomFees; recurring fees live in driver_weekly_fees. */
export async function sumCustomFees(client: PoolClient, payoutId: string): Promise<CustomFeeTotals> {
  return sumManualCustomFees(client, payoutId);
}

type ApplyPayoutFeesOptions = {
  /** When true, caller already ran syncRecurringFeesToDriverWeek for this driver/week. */
  skipWeeklySync?: boolean;
};

/** Apply manual + weekly recurring (anchor only) to one payout row. */
export async function applyPayoutCustomFeesToRawNet(
  client: PoolClient,
  orgId: string,
  payoutId: string,
  options?: ApplyPayoutFeesOptions,
): Promise<number> {
  const pr = await client.query<{
    driver_id: string;
    total_net_earnings: string | null;
    company_commission: string | null;
    total_daily_cash: string | null;
    account_opening_fee: string | null;
    vehicle_rental_fee: string | null;
    payment_period_start: string;
    payment_period_end: string;
  }>(
    `SELECT driver_id::text, total_net_earnings::text, company_commission::text, total_daily_cash::text,
            account_opening_fee::text, vehicle_rental_fee::text,
            payment_period_start::text, payment_period_end::text
     FROM driver_payouts
     WHERE id = $1::uuid AND organization_id = $2::uuid
     FOR UPDATE`,
    [payoutId, orgId],
  );
  const row = pr.rows[0];
  if (!row) return 0;

  const periodStart = row.payment_period_start.slice(0, 10);
  const periodEnd = row.payment_period_end.slice(0, 10);

  if (!options?.skipWeeklySync) {
    await syncRecurringFeesToDriverWeek(client, orgId, row.driver_id, periodStart, periodEnd);
  }

  const baseRaw = computeBaseRawNet({
    total_net_earnings: Number(row.total_net_earnings ?? "0"),
    company_commission: Number(row.company_commission ?? "0"),
    total_daily_cash: Number(row.total_daily_cash ?? "0"),
    account_opening_fee: Number(row.account_opening_fee ?? "0"),
    vehicle_rental_fee: Number(row.vehicle_rental_fee ?? "0"),
  });

  const manualFees = await sumManualCustomFees(client, payoutId);
  const anchorId = await selectWeeklyFeeAnchorPayoutId(
    client,
    orgId,
    row.driver_id,
    periodStart,
    periodEnd,
  );
  const weeklyFees =
    anchorId === payoutId
      ? await sumWeeklyRecurringFees(client, orgId, row.driver_id, periodStart, periodEnd)
      : { deductions: 0, additions: 0 };

  const adjustedRaw = roundMoney(
    baseRaw - manualFees.deductions - weeklyFees.deductions + manualFees.additions + weeklyFees.additions,
  );

  await client.query(
    `UPDATE driver_payouts
     SET raw_net_amount = $1, updated_at = NOW()
     WHERE id = $2::uuid AND organization_id = $3::uuid`,
    [adjustedRaw, payoutId, orgId],
  );

  return adjustedRaw;
}

/** @deprecated Prefer applyPayoutCustomFeesToRawNet or applyWeeklyCustomFees. */
export async function applyCustomFeesToRawNet(client: PoolClient, orgId: string, payoutId: string): Promise<number> {
  return applyPayoutCustomFeesToRawNet(client, orgId, payoutId);
}

export type ApplyWeeklyCustomFeesResult = {
  driversProcessed: number;
  payoutRowsUpdated: number;
};

/**
 * Materialize recurring fees per driver/week and apply to all platform payout rows.
 * Weekly recurring deducts on anchor payout only (Glovo → Uber → Bolt Taxi → Bolt).
 * Re-run for the full payment week after each import so former anchor rows are cleared.
 */
export async function applyWeeklyCustomFeesToRawNet(
  client: PoolClient,
  orgId: string,
  periodStart: string,
  periodEnd: string,
  driverIds?: string[],
): Promise<ApplyWeeklyCustomFeesResult> {
  const ps = periodStart.slice(0, 10);
  const pe = periodEnd.slice(0, 10);

  const driverRes = await client.query<{ driver_id: string }>(
    driverIds?.length
      ? `SELECT DISTINCT driver_id::text
         FROM driver_payouts
         WHERE organization_id = $1::uuid
           AND payment_period_start = $2::date
           AND payment_period_end = $3::date
           AND driver_id = ANY($4::uuid[])`
      : `SELECT DISTINCT driver_id::text
         FROM driver_payouts
         WHERE organization_id = $1::uuid
           AND payment_period_start = $2::date
           AND payment_period_end = $3::date`,
    driverIds?.length ? [orgId, ps, pe, driverIds] : [orgId, ps, pe],
  );

  let payoutRowsUpdated = 0;
  for (const { driver_id: driverId } of driverRes.rows) {
    await syncRecurringFeesToDriverWeek(client, orgId, driverId, ps, pe);

    const payouts = await client.query<{ id: string }>(
      `SELECT id::text FROM driver_payouts
       WHERE organization_id = $1::uuid AND driver_id = $2::uuid
         AND payment_period_start = $3::date AND payment_period_end = $4::date
       ORDER BY id`,
      [orgId, driverId, ps, pe],
    );

    for (const { id } of payouts.rows) {
      await applyPayoutCustomFeesToRawNet(client, orgId, id, { skipWeeklySync: true });
      payoutRowsUpdated += 1;
    }
  }

  return { driversProcessed: driverRes.rows.length, payoutRowsUpdated };
}

/** Apply weekly custom fees for a payment week, then recompute debt carry-forward per driver. */
export async function applyWeeklyCustomFees(
  client: PoolClient,
  orgId: string,
  periodStart: string,
  periodEnd: string,
  driverIds?: string[],
): Promise<ApplyWeeklyCustomFeesResult> {
  const result = await applyWeeklyCustomFeesToRawNet(client, orgId, periodStart, periodEnd, driverIds);

  const ps = periodStart.slice(0, 10);
  const pe = periodEnd.slice(0, 10);
  const driverRes = await client.query<{ driver_id: string }>(
    driverIds?.length
      ? `SELECT DISTINCT driver_id::text
         FROM driver_payouts
         WHERE organization_id = $1::uuid
           AND payment_period_start = $2::date
           AND payment_period_end = $3::date
           AND driver_id = ANY($4::uuid[])`
      : `SELECT DISTINCT driver_id::text
         FROM driver_payouts
         WHERE organization_id = $1::uuid
           AND payment_period_start = $2::date
           AND payment_period_end = $3::date`,
    driverIds?.length ? [orgId, ps, pe, driverIds] : [orgId, ps, pe],
  );

  for (const { driver_id: driverId } of driverRes.rows) {
    await recomputeDriverDebtAllocation(client, orgId, driverId);
  }

  return result;
}

/** Re-sync weekly recurring + custom raw net on all open payouts for a driver, then debt allocation. */
export async function recomputeDriverOpenPayoutsAfterRecurringChange(
  client: PoolClient,
  orgId: string,
  driverId: string,
): Promise<void> {
  const { rows } = await client.query<{
    id: string;
    payment_period_start: string;
    payment_period_end: string;
  }>(
    `SELECT id::text, payment_period_start::text, payment_period_end::text
     FROM driver_payouts
     WHERE organization_id = $1::uuid AND driver_id = $2::uuid
       AND payment_status NOT IN ('paid', 'approved')
     ORDER BY payment_period_end ASC, id ASC`,
    [orgId, driverId],
  );

  const weeks = new Map<string, { start: string; end: string }>();
  for (const p of rows) {
    const ps = p.payment_period_start.slice(0, 10);
    const pe = p.payment_period_end.slice(0, 10);
    weeks.set(`${ps}|${pe}`, { start: ps, end: pe });
  }
  for (const { start, end } of weeks.values()) {
    await applyWeeklyCustomFees(client, orgId, start, end, [driverId]);
  }
}

/** Re-apply custom fees then full debt carry-forward for the driver. */
export async function recomputeDriverPayoutAfterCustomFees(
  client: PoolClient,
  orgId: string,
  payoutId: string,
): Promise<void> {
  const dr = await client.query<{ driver_id: string }>(
    `SELECT driver_id::text FROM driver_payouts WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [payoutId, orgId],
  );
  const driverId = dr.rows[0]?.driver_id;
  if (!driverId) return;

  const pr = await client.query<{ payment_period_start: string; payment_period_end: string }>(
    `SELECT payment_period_start::text, payment_period_end::text
     FROM driver_payouts WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [payoutId, orgId],
  );
  const period = pr.rows[0];
  if (!period) return;

  await applyWeeklyCustomFees(client, orgId, period.payment_period_start, period.payment_period_end, [driverId]);
}

export type CustomFeeSource = "manual" | "recurring";

export type CustomFeeRow = {
  id: string;
  fee_name: string;
  fee_type: CustomFeeType;
  amount: string;
  source: CustomFeeSource;
  recurring_fee_id: string | null;
  notes: string | null;
  created_at: string;
};

export async function listCustomFeesForPayout(
  client: PoolClient,
  orgId: string,
  payoutId: string,
): Promise<CustomFeeRow[]> {
  const pr = await client.query<{
    driver_id: string;
    payment_period_start: string;
    payment_period_end: string;
  }>(
    `SELECT driver_id::text, payment_period_start::text, payment_period_end::text
     FROM driver_payouts WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [payoutId, orgId],
  );
  const payout = pr.rows[0];
  if (!payout) return [];

  const [manualRows, weeklyRows] = await Promise.all([
    client.query<CustomFeeRow>(
      `SELECT id::text, fee_name, fee_type, amount::text, source, recurring_fee_id::text,
              notes, created_at::text
       FROM driver_payout_adjustments
       WHERE driver_payout_id = $1::uuid AND organization_id = $2::uuid AND source = 'manual'
       ORDER BY created_at ASC, id ASC`,
      [payoutId, orgId],
    ),
    listWeeklyRecurringFeesForDriverWeek(
      client,
      orgId,
      payout.driver_id,
      payout.payment_period_start,
      payout.payment_period_end,
    ),
  ]);

  const recurringRows: CustomFeeRow[] = weeklyRows.map((w) => ({
    id: w.id,
    fee_name: w.fee_name,
    fee_type: w.fee_type,
    amount: w.amount,
    source: "recurring",
    recurring_fee_id: w.recurring_fee_id,
    notes: null,
    created_at: w.created_at,
  }));

  return [...recurringRows, ...manualRows.rows];
}

export async function fetchPayoutCustomFeeSummary(
  client: PoolClient,
  orgId: string,
  payoutId: string,
): Promise<{
  base_raw_net: number;
  total_deductions: number;
  total_additions: number;
  raw_net_amount: number;
  net_driver_payout: number;
  is_weekly_fee_anchor: boolean;
  weekly_fee_anchor_platform: string | null;
}> {
  const pr = await client.query<{
    driver_id: string;
    total_net_earnings: string | null;
    company_commission: string | null;
    total_daily_cash: string | null;
    account_opening_fee: string | null;
    vehicle_rental_fee: string | null;
    raw_net_amount: string | null;
    net_driver_payout: string | null;
    payment_period_start: string;
    payment_period_end: string;
  }>(
    `SELECT driver_id::text, total_net_earnings::text, company_commission::text, total_daily_cash::text,
            account_opening_fee::text, vehicle_rental_fee::text,
            raw_net_amount::text, net_driver_payout::text,
            payment_period_start::text, payment_period_end::text
     FROM driver_payouts
     WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [payoutId, orgId],
  );
  const row = pr.rows[0];
  if (!row) {
    return {
      base_raw_net: 0,
      total_deductions: 0,
      total_additions: 0,
      raw_net_amount: 0,
      net_driver_payout: 0,
      is_weekly_fee_anchor: false,
      weekly_fee_anchor_platform: null,
    };
  }

  const periodStart = row.payment_period_start.slice(0, 10);
  const periodEnd = row.payment_period_end.slice(0, 10);

  const baseRaw = computeBaseRawNet({
    total_net_earnings: Number(row.total_net_earnings ?? "0"),
    company_commission: Number(row.company_commission ?? "0"),
    total_daily_cash: Number(row.total_daily_cash ?? "0"),
    account_opening_fee: Number(row.account_opening_fee ?? "0"),
    vehicle_rental_fee: Number(row.vehicle_rental_fee ?? "0"),
  });

  const manualFees = await sumManualCustomFees(client, payoutId);
  const weeklyRows = await listWeeklyRecurringFeesForDriverWeek(
    client,
    orgId,
    row.driver_id,
    periodStart,
    periodEnd,
  );
  const weeklyTotals = weeklyRows.reduce(
    (acc, w) => {
      const amount = roundMoney(Number(w.amount));
      if (w.fee_type === "deduction") acc.deductions = roundMoney(acc.deductions + amount);
      else acc.additions = roundMoney(acc.additions + amount);
      return acc;
    },
    { deductions: 0, additions: 0 },
  );

  const anchorId = await selectWeeklyFeeAnchorPayoutId(
    client,
    orgId,
    row.driver_id,
    periodStart,
    periodEnd,
  );
  const isAnchor = anchorId === payoutId;

  let anchorPlatform: string | null = null;
  if (anchorId) {
    const ap = await client.query<{ platform: string }>(
      `SELECT platform FROM driver_payouts WHERE id = $1::uuid`,
      [anchorId],
    );
    anchorPlatform = ap.rows[0]?.platform ?? null;
  }

  const appliedWeekly = isAnchor ? weeklyTotals : { deductions: 0, additions: 0 };

  return {
    base_raw_net: baseRaw,
    total_deductions: roundMoney(manualFees.deductions + appliedWeekly.deductions),
    total_additions: roundMoney(manualFees.additions + appliedWeekly.additions),
    raw_net_amount: roundMoney(Number(row.raw_net_amount ?? "0")),
    net_driver_payout: roundMoney(Number(row.net_driver_payout ?? "0")),
    is_weekly_fee_anchor: isAnchor,
    weekly_fee_anchor_platform: anchorPlatform,
  };
}

/** Pure helper: adjusted raw net with manual + weekly recurring (anchor only). */
export function computeAdjustedRawNetWithFees(
  baseRaw: number,
  manual: CustomFeeTotals,
  weekly: CustomFeeTotals,
  isAnchor: boolean,
): number {
  const weeklyApplied = isAnchor ? weekly : { deductions: 0, additions: 0 };
  return roundMoney(
    baseRaw -
      manual.deductions -
      weeklyApplied.deductions +
      manual.additions +
      weeklyApplied.additions,
  );
}
