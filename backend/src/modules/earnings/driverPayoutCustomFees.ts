import type { PoolClient } from "pg";
import { recomputeDriverDebtAllocation, roundMoney } from "./debtAllocation";
import { syncRecurringFeesToPayout } from "./driverRecurringFees";

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

export async function sumCustomFees(client: PoolClient, payoutId: string): Promise<CustomFeeTotals> {
  const { rows } = await client.query<{ deductions: string | null; additions: string | null }>(
    `SELECT
       COALESCE(SUM(CASE WHEN fee_type = 'deduction' THEN amount ELSE 0 END), 0)::text AS deductions,
       COALESCE(SUM(CASE WHEN fee_type = 'addition' THEN amount ELSE 0 END), 0)::text AS additions
     FROM driver_payout_adjustments
     WHERE driver_payout_id = $1::uuid`,
    [payoutId],
  );
  const row = rows[0];
  return {
    deductions: roundMoney(Number(row?.deductions ?? "0")),
    additions: roundMoney(Number(row?.additions ?? "0")),
  };
}

/** Apply recurring materialization + all adjustment rows to raw_net_amount before debt carry-forward. */
export async function applyCustomFeesToRawNet(client: PoolClient, orgId: string, payoutId: string): Promise<number> {
  await syncRecurringFeesToPayout(client, orgId, payoutId);

  const pr = await client.query<{
    total_net_earnings: string | null;
    company_commission: string | null;
    total_daily_cash: string | null;
    account_opening_fee: string | null;
    vehicle_rental_fee: string | null;
  }>(
    `SELECT total_net_earnings::text, company_commission::text, total_daily_cash::text,
            account_opening_fee::text, vehicle_rental_fee::text
     FROM driver_payouts
     WHERE id = $1::uuid AND organization_id = $2::uuid
     FOR UPDATE`,
    [payoutId, orgId],
  );
  const row = pr.rows[0];
  if (!row) return 0;

  const baseRaw = computeBaseRawNet({
    total_net_earnings: Number(row.total_net_earnings ?? "0"),
    company_commission: Number(row.company_commission ?? "0"),
    total_daily_cash: Number(row.total_daily_cash ?? "0"),
    account_opening_fee: Number(row.account_opening_fee ?? "0"),
    vehicle_rental_fee: Number(row.vehicle_rental_fee ?? "0"),
  });

  const { deductions, additions } = await sumCustomFees(client, payoutId);
  const adjustedRaw = roundMoney(baseRaw - deductions + additions);

  await client.query(
    `UPDATE driver_payouts
     SET raw_net_amount = $1, updated_at = NOW()
     WHERE id = $2::uuid AND organization_id = $3::uuid`,
    [adjustedRaw, payoutId, orgId],
  );

  return adjustedRaw;
}

/** Re-sync recurring + custom raw net on all open payouts for a driver, then debt allocation. */
export async function recomputeDriverOpenPayoutsAfterRecurringChange(
  client: PoolClient,
  orgId: string,
  driverId: string,
): Promise<void> {
  const { rows } = await client.query<{ id: string }>(
    `SELECT id::text FROM driver_payouts
     WHERE organization_id = $1::uuid AND driver_id = $2::uuid
       AND payment_status NOT IN ('paid', 'approved')
     ORDER BY payment_period_end ASC, id ASC`,
    [orgId, driverId],
  );
  for (const p of rows) {
    await applyCustomFeesToRawNet(client, orgId, p.id);
  }
  if (rows.length > 0) {
    await recomputeDriverDebtAllocation(client, orgId, driverId);
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

  await applyCustomFeesToRawNet(client, orgId, payoutId);
  await recomputeDriverDebtAllocation(client, orgId, driverId);
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
  const { rows } = await client.query<CustomFeeRow>(
    `SELECT id::text, fee_name, fee_type, amount::text, source, recurring_fee_id::text,
            notes, created_at::text
     FROM driver_payout_adjustments
     WHERE driver_payout_id = $1::uuid AND organization_id = $2::uuid
     ORDER BY source ASC, created_at ASC, id ASC`,
    [payoutId, orgId],
  );
  return rows;
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
}> {
  const pr = await client.query<{
    total_net_earnings: string | null;
    company_commission: string | null;
    total_daily_cash: string | null;
    account_opening_fee: string | null;
    vehicle_rental_fee: string | null;
    raw_net_amount: string | null;
    net_driver_payout: string | null;
  }>(
    `SELECT total_net_earnings::text, company_commission::text, total_daily_cash::text,
            account_opening_fee::text, vehicle_rental_fee::text,
            raw_net_amount::text, net_driver_payout::text
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
    };
  }

  const baseRaw = computeBaseRawNet({
    total_net_earnings: Number(row.total_net_earnings ?? "0"),
    company_commission: Number(row.company_commission ?? "0"),
    total_daily_cash: Number(row.total_daily_cash ?? "0"),
    account_opening_fee: Number(row.account_opening_fee ?? "0"),
    vehicle_rental_fee: Number(row.vehicle_rental_fee ?? "0"),
  });
  const { deductions, additions } = await sumCustomFees(client, payoutId);

  return {
    base_raw_net: baseRaw,
    total_deductions: deductions,
    total_additions: additions,
    raw_net_amount: roundMoney(Number(row.raw_net_amount ?? "0")),
    net_driver_payout: roundMoney(Number(row.net_driver_payout ?? "0")),
  };
}
