import type { PoolClient } from "pg";
import {
  computeWeekDebtPool,
  distributeWeekNetToLegs,
  type WeekPlatformLeg,
} from "./crossPlatformDebt";
import { filterOpenWeekLegs, isFrozenPayoutStatus, OPEN_PAYOUT_STATUS_SQL } from "./payoutFreeze";

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * When re-applying carry-forward for a negative raw_net period, preserve manually reduced
 * remaining (partial forgive) or manually increased remaining (delta adjust), without
 * resetting to full abs(raw_net) on every allocation pass.
 */
export function nextRemainingForNegativePayoutRow(params: {
  debtAmount: number;
  existingRem: number;
  paymentStatus: string;
}): number {
  const { debtAmount, existingRem, paymentStatus } = params;
  const rem = roundMoney(Math.max(0, existingRem));
  const debt = roundMoney(Math.max(0, debtAmount));
  if (paymentStatus === "hold" && rem === 0) {
    return 0;
  }
  if (rem <= debt) {
    if (rem > 0) {
      return roundMoney(Math.min(debt, rem));
    }
    return debt;
  }
  return rem;
}

export type DebtPayoutResolution = {
  net_driver_payout: number;
  debt_amount: number;
  remaining_debt_amount: number;
  payment_status: string;
};

/**
 * Pure debt/payout resolution from raw_net (after rent sync). Used by applyDebtCarryForward and tests.
 * Negative raw_net → signed net_driver_payout (e.g. -443.91), debt status, debt_amount = |raw_net|.
 * Positive raw_net → net_driver_payout = max(0, after carry-forward to older debts).
 */
export function resolveDebtPayoutFromRawNet(params: {
  rawNet: number;
  existingRemainingDebt: number;
  currentPaymentStatus: string;
  /** Remaining raw_net after applying this period's surplus to older debt rows (only when rawNet >= 0). */
  availableAfterCarryForward: number;
}): DebtPayoutResolution {
  const rawNet = roundMoney(params.rawNet);
  let debtAmount = 0;
  let remainingDebtAmount = 0;
  let netDriverPayout = 0;

  if (rawNet < 0) {
    debtAmount = roundMoney(Math.abs(rawNet));
    remainingDebtAmount = nextRemainingForNegativePayoutRow({
      debtAmount,
      existingRem: params.existingRemainingDebt,
      paymentStatus: params.currentPaymentStatus,
    });
    netDriverPayout = rawNet;
  } else {
    netDriverPayout = roundMoney(Math.max(0, params.availableAfterCarryForward));
  }

  const payment_status = resolvePaymentStatusAfterDebtAllocation({
    rawNet,
    remainingDebtAmount,
    currentPaymentStatus: params.currentPaymentStatus,
  });

  return {
    net_driver_payout: netDriverPayout,
    debt_amount: debtAmount,
    remaining_debt_amount: remainingDebtAmount,
    payment_status,
  };
}

export function resolvePaymentStatusAfterDebtAllocation(params: {
  rawNet: number;
  remainingDebtAmount: number;
  currentPaymentStatus: string;
}): string {
  const { rawNet, remainingDebtAmount, currentPaymentStatus } = params;
  if (
    rawNet < 0 &&
    currentPaymentStatus === "hold" &&
    roundMoney(Math.max(0, remainingDebtAmount)) === 0
  ) {
    return "hold";
  }
  if (rawNet < 0 || remainingDebtAmount > 0) {
    return "debt";
  }
  if (
    currentPaymentStatus === "paid" ||
    currentPaymentStatus === "approved" ||
    currentPaymentStatus === "hold"
  ) {
    return currentPaymentStatus;
  }
  return "pending";
}


type WeekPayoutRow = {
  id: string;
  driver_id: string;
  platform: string;
  raw_net_amount: string | null;
  payment_status: string;
  payment_period_start: string;
  payment_period_end: string;
  remaining_debt_amount: string | null;
};

/**
 * Pool all platform legs for a driver-week, offset negative platforms against positive
 * platforms, then apply older-period debt once on the combined net.
 */
export async function applyWeekDebtCarryForward(
  client: PoolClient,
  orgId: string,
  driverId: string,
  weekStart: string,
  weekEnd: string,
): Promise<void> {
  const ps = weekStart.slice(0, 10);
  const pe = weekEnd.slice(0, 10);

  const weekRes = await client.query<WeekPayoutRow>(
    `SELECT id::text, driver_id::text, platform, raw_net_amount::text, payment_status,
            payment_period_start::text, payment_period_end::text, remaining_debt_amount::text
     FROM driver_payouts
     WHERE organization_id = $1::uuid
       AND driver_id = $2::uuid
       AND payment_period_start = $3::date
       AND payment_period_end = $4::date
     ORDER BY platform, id
     FOR UPDATE`,
    [orgId, driverId, ps, pe],
  );
  const weekRows = weekRes.rows;
  if (!weekRows.length) return;

  const allLegs: WeekPlatformLeg[] = weekRows.map((r) => ({
    payoutId: r.id,
    platform: r.platform,
    rawNet: roundMoney(Number(r.raw_net_amount ?? "0")),
    existingRemainingDebt: roundMoney(Number(r.remaining_debt_amount ?? "0")),
    currentPaymentStatus: r.payment_status,
  }));

  const legs = filterOpenWeekLegs(allLegs);
  if (!legs.length) return;

  const weekIds = weekRows.map((r) => r.id);

  const pool = computeWeekDebtPool(legs);
  const anchor = legs.reduce((a, b) => {
    if (a.rawNet < -0.02 && b.rawNet < -0.02) return a.rawNet < b.rawNet ? a : b;
    if (a.rawNet < -0.02) return a;
    if (b.rawNet < -0.02) return b;
    return a.rawNet >= b.rawNet ? a : b;
  });

  const outstandingDebtRes = await client.query<{ id: string; remaining_debt_amount: string | null }>(
    `SELECT id::text, remaining_debt_amount::text
     FROM driver_payouts
     WHERE organization_id = $1::uuid
       AND driver_id = $2::uuid
       AND id <> ALL($3::uuid[])
       AND COALESCE(remaining_debt_amount, 0) > 0
       AND payment_period_end <= $4::date
     ORDER BY payment_period_end ASC, id ASC
     FOR UPDATE`,
    [orgId, driverId, weekIds, pe],
  );

  let weekFinalNet = 0;
  let debtAppliedToOlder = 0;
  let newWeekDebtAmount = 0;
  let remainingDebtAmount = 0;
  let weekPaymentStatus = "pending";

  if (pool.weekRawNet < -0.02) {
    newWeekDebtAmount = roundMoney(Math.abs(pool.weekRawNet));
    remainingDebtAmount = nextRemainingForNegativePayoutRow({
      debtAmount: newWeekDebtAmount,
      existingRem: anchor.existingRemainingDebt,
      paymentStatus: anchor.currentPaymentStatus,
    });
    weekFinalNet = pool.weekRawNet;
    weekPaymentStatus = resolvePaymentStatusAfterDebtAllocation({
      rawNet: pool.weekRawNet,
      remainingDebtAmount,
      currentPaymentStatus: anchor.currentPaymentStatus,
    });
  } else {
    let available = pool.weekRawNet;
    for (const debt of outstandingDebtRes.rows) {
      if (available <= 0) break;
      const outstanding = roundMoney(Number(debt.remaining_debt_amount ?? "0"));
      if (outstanding <= 0) continue;
      const applied = roundMoney(Math.min(available, outstanding));
      const nextRemaining = roundMoney(Math.max(0, outstanding - applied));
      await client.query(
        `UPDATE driver_payouts
         SET remaining_debt_amount = $1,
             debt_applied_amount = COALESCE(debt_applied_amount, 0) + $2
         WHERE id = $3::uuid AND organization_id = $4::uuid`,
        [nextRemaining, applied, debt.id, orgId],
      );
      debtAppliedToOlder = roundMoney(debtAppliedToOlder + applied);
      available = roundMoney(available - applied);
    }
    weekFinalNet = roundMoney(Math.max(0, available));
    weekPaymentStatus = resolvePaymentStatusAfterDebtAllocation({
      rawNet: pool.weekRawNet,
      remainingDebtAmount: 0,
      currentPaymentStatus: anchor.currentPaymentStatus,
    });
  }

  const allocation = distributeWeekNetToLegs(legs, pool, {
    weekFinalNet,
    debtAppliedToOlder,
    newWeekDebtAmount,
    remainingDebtAmount,
    weekPaymentStatus,
  });

  for (const leg of legs) {
    if (isFrozenPayoutStatus(leg.currentPaymentStatus)) continue;
    const row = allocation.get(leg.payoutId);
    if (!row) continue;
    const holdReasonSql =
      row.payment_status === "hold" ? `, hold_reason = COALESCE(hold_reason, 'system_debt_forgiven')` : "";
    await client.query(
      `UPDATE driver_payouts
       SET net_driver_payout = $1,
           debt_amount = $2,
           debt_applied_amount = $3,
           remaining_debt_amount = $4,
           payment_status = $5,
           cross_platform_debt_offset = $6,
           week_debt_platforms = $7::text[]${holdReasonSql}
       WHERE id = $8::uuid AND organization_id = $9::uuid`,
      [
        row.net_driver_payout,
        row.debt_amount,
        row.debt_applied_amount,
        row.remaining_debt_amount,
        row.payment_status,
        pool.crossPlatformDebtOffset,
        pool.debtPlatforms,
        leg.payoutId,
        orgId,
      ],
    );
  }
}

/**
 * After `raw_net_amount` is set on a driver_payout, recompute debt for the full driver-week.
 */
export async function applyDebtCarryForward(client: PoolClient, orgId: string, payoutId: string): Promise<void> {
  const currentRes = await client.query<{
    driver_id: string;
    payment_period_start: string;
    payment_period_end: string;
  }>(
    `SELECT driver_id::text, payment_period_start::text, payment_period_end::text
     FROM driver_payouts
     WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [payoutId, orgId],
  );
  const current = currentRes.rows[0];
  if (!current) return;
  await applyWeekDebtCarryForward(
    client,
    orgId,
    current.driver_id,
    current.payment_period_start,
    current.payment_period_end,
  );
}

/**
 * Re-apply carry-forward for weeks on or after the edited payout (same driver).
 */
export async function propagateDebtAfterManualEdit(
  client: PoolClient,
  orgId: string,
  driverId: string,
  pivotPeriodEnd: string,
  _pivotPayoutId: string,
): Promise<void> {
  const weeksRes = await client.query<{ payment_period_start: string; payment_period_end: string }>(
    `SELECT DISTINCT payment_period_start::text, payment_period_end::text
     FROM driver_payouts
     WHERE organization_id = $1::uuid AND driver_id = $2::uuid
       AND payment_period_end >= $3::date
     ORDER BY payment_period_start, payment_period_end`,
    [orgId, driverId, pivotPeriodEnd],
  );
  for (const w of weeksRes.rows) {
    await applyWeekDebtCarryForward(client, orgId, driverId, w.payment_period_start, w.payment_period_end);
  }
}

/**
 * Reset debt-derived fields from raw_net_amount, then re-apply carry-forward in period order.
 * Preserves forgiven negative rows (`hold` with `remaining_debt_amount = 0`) from being re-opened as debt.
 */
export async function recomputeDriverDebtAllocation(client: PoolClient, orgId: string, driverId: string): Promise<void> {
  const idsRes = await client.query<{ id: string }>(
    `SELECT id::text
     FROM driver_payouts
     WHERE organization_id = $1::uuid AND driver_id = $2::uuid
     ORDER BY payment_period_end ASC, id ASC
     FOR UPDATE`,
    [orgId, driverId],
  );
  const ids = idsRes.rows.map((r) => r.id);
  if (!ids.length) return;

  await client.query(
    `UPDATE driver_payouts
     SET debt_applied_amount = 0
     WHERE organization_id = $1::uuid AND driver_id = $2::uuid
       AND ${OPEN_PAYOUT_STATUS_SQL}`,
    [orgId, driverId],
  );

  await client.query(
    `UPDATE driver_payouts
     SET
       debt_amount = CASE WHEN COALESCE(raw_net_amount, 0) < 0 THEN ROUND(ABS(raw_net_amount)::numeric, 2) ELSE 0 END,
       remaining_debt_amount = CASE
         WHEN COALESCE(raw_net_amount, 0) < 0
              AND payment_status = 'hold'
              AND COALESCE(remaining_debt_amount, 0) = 0
           THEN 0
         WHEN COALESCE(raw_net_amount, 0) < 0 THEN ROUND(ABS(raw_net_amount)::numeric, 2)
         ELSE 0
       END,
       net_driver_payout = raw_net_amount,
       cross_platform_debt_offset = 0,
       week_debt_platforms = '{}',
       payment_status = CASE
         WHEN COALESCE(raw_net_amount, 0) < 0
              AND payment_status = 'hold'
              AND COALESCE(remaining_debt_amount, 0) = 0
           THEN 'hold'
         WHEN COALESCE(raw_net_amount, 0) < 0 THEN 'debt'
         WHEN payment_status IN ('paid', 'approved', 'hold') THEN payment_status
         ELSE 'pending'
       END
     WHERE organization_id = $1::uuid AND driver_id = $2::uuid
       AND ${OPEN_PAYOUT_STATUS_SQL}`,
    [orgId, driverId],
  );

  const weeksRes = await client.query<{ payment_period_start: string; payment_period_end: string }>(
    `SELECT DISTINCT payment_period_start::text, payment_period_end::text
     FROM driver_payouts
     WHERE organization_id = $1::uuid AND driver_id = $2::uuid
       AND ${OPEN_PAYOUT_STATUS_SQL}
     ORDER BY payment_period_start, payment_period_end`,
    [orgId, driverId],
  );
  const { applyWeeklyCustomFeesToRawNet } = await import("./driverPayoutCustomFees");
  for (const w of weeksRes.rows) {
    await applyWeeklyCustomFeesToRawNet(
      client,
      orgId,
      w.payment_period_start,
      w.payment_period_end,
      [driverId],
    );
  }

  for (const w of weeksRes.rows) {
    await applyWeekDebtCarryForward(client, orgId, driverId, w.payment_period_start, w.payment_period_end);
  }
}
