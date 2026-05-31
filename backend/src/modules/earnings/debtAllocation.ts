import type { PoolClient } from "pg";

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

type CurrentPayoutRow = {
  id: string;
  driver_id: string;
  raw_net_amount: string | null;
  payment_status: string;
  payment_period_end: string;
  remaining_debt_amount: string | null;
};

/**
 * After `raw_net_amount` is set on a driver_payout, compute debt carry-forward from
 * older periods (same driver) and set net_driver_payout / debt fields on this row.
 * Also reduces `remaining_debt_amount` on prior debt rows when this period has positive raw net.
 *
 * Forgiven negative periods (`payment_status = hold` and `remaining_debt_amount = 0`) keep 0 remaining.
 */
export async function applyDebtCarryForward(client: PoolClient, orgId: string, payoutId: string): Promise<void> {
  const currentRes = await client.query<CurrentPayoutRow>(
    `SELECT id::text, driver_id::text, raw_net_amount::text, payment_status, payment_period_end::text,
            remaining_debt_amount::text
     FROM driver_payouts
     WHERE id = $1::uuid AND organization_id = $2::uuid
     FOR UPDATE`,
    [payoutId, orgId],
  );
  const current = currentRes.rows[0];
  if (!current) return;

  const outstandingDebtRes = await client.query<{
    id: string;
    remaining_debt_amount: string | null;
  }>(
    `SELECT id::text, remaining_debt_amount::text
     FROM driver_payouts
     WHERE organization_id = $1::uuid
       AND driver_id = $2::uuid
       AND id <> $3::uuid
       AND COALESCE(remaining_debt_amount, 0) > 0
       AND payment_period_end <= $4::date
     ORDER BY payment_period_end ASC, id ASC
     FOR UPDATE`,
    [orgId, current.driver_id, current.id, current.payment_period_end],
  );

  const rawNet = roundMoney(Number(current.raw_net_amount ?? "0"));
  let debtApplied = 0;
  let debtAmount = 0;
  let remainingDebtAmount = 0;
  let payable = 0;

  if (rawNet < 0) {
    debtAmount = roundMoney(Math.abs(rawNet));
    const existingRem = roundMoney(Number(current.remaining_debt_amount ?? "0"));
    remainingDebtAmount = nextRemainingForNegativePayoutRow({
      debtAmount,
      existingRem,
      paymentStatus: current.payment_status,
    });
    payable = rawNet;
  } else {
    let available = rawNet;
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
      debtApplied = roundMoney(debtApplied + applied);
      available = roundMoney(available - applied);
    }
    payable = roundMoney(Math.max(0, available));
  }

  const nextStatus = resolvePaymentStatusAfterDebtAllocation({
    rawNet,
    remainingDebtAmount,
    currentPaymentStatus: current.payment_status,
  });

  const holdReasonSql =
    nextStatus === "hold"
      ? `, hold_reason = COALESCE(hold_reason, 'system_debt_forgiven')`
      : "";

  await client.query(
    `UPDATE driver_payouts
     SET net_driver_payout = $1,
         debt_amount = $2,
         debt_applied_amount = $3,
         remaining_debt_amount = $4,
         payment_status = $5${holdReasonSql}
     WHERE id = $6::uuid AND organization_id = $7::uuid`,
    [payable, debtAmount, debtApplied, remainingDebtAmount, nextStatus, payoutId, orgId],
  );
}

/**
 * Re-apply carry-forward for payouts strictly after the edited row (same driver).
 */
export async function propagateDebtAfterManualEdit(
  client: PoolClient,
  orgId: string,
  driverId: string,
  pivotPeriodEnd: string,
  pivotPayoutId: string,
): Promise<void> {
  const res = await client.query<{ id: string }>(
    `SELECT id::text FROM driver_payouts
     WHERE organization_id = $1::uuid AND driver_id = $2::uuid
       AND (payment_period_end > $3::date OR (payment_period_end = $3::date AND id > $4::uuid))
     ORDER BY payment_period_end ASC, id ASC`,
    [orgId, driverId, pivotPeriodEnd, pivotPayoutId],
  );
  for (const row of res.rows) {
    await applyDebtCarryForward(client, orgId, row.id);
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
     WHERE organization_id = $1::uuid AND driver_id = $2::uuid`,
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
       payment_status = CASE
         WHEN COALESCE(raw_net_amount, 0) < 0
              AND payment_status = 'hold'
              AND COALESCE(remaining_debt_amount, 0) = 0
           THEN 'hold'
         WHEN COALESCE(raw_net_amount, 0) < 0 THEN 'debt'
         WHEN payment_status IN ('paid', 'approved', 'hold') THEN payment_status
         ELSE 'pending'
       END
     WHERE organization_id = $1::uuid AND driver_id = $2::uuid`,
    [orgId, driverId],
  );

  const weeksRes = await client.query<{ payment_period_start: string; payment_period_end: string }>(
    `SELECT DISTINCT payment_period_start::text, payment_period_end::text
     FROM driver_payouts
     WHERE organization_id = $1::uuid AND driver_id = $2::uuid
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

  for (const id of ids) {
    await applyDebtCarryForward(client, orgId, id);
  }
}
