import type { PoolClient } from "pg";
import { driverCommissionRateAsFraction } from "./calculatePayout";
import type { DriverMatchRow } from "./matchDriver";
import { computeCompanyCommissionFromBase } from "./commission";
import { applyDebtCarryForward, roundMoney } from "./debtAllocation";
import { applyCustomFeesToRawNet } from "./driverPayoutCustomFees";
import type { EarningsPlatform } from "./detectPlatform";
import { payoutPlatformFromEarnings, type DriverPayoutPlatform } from "./payoutPlatform";
import { payoutPlatformIdForDriver } from "./payoutPlatformId";
import { syncPayoutRentEntries } from "./payoutRentEntries";

export type EarningsPeriodAgg = {
  income: number;
  tips: number;
  feeSigned: number;
  feeAbs: number;
  dailyCash: number;
  accountOpening: number;
  platformNet: number;
};

export function aggregateEarningsPeriodTotals(rows: {
  gross_earnings: string | null;
  tips: string | null;
  platform_fee: string | null;
  daily_cash: string | null;
  account_opening_fee: string | null;
  net_earnings?: string | null;
}[]): EarningsPeriodAgg {
  let income = 0;
  let tips = 0;
  let feeSigned = 0;
  let feeAbs = 0;
  let dailyCash = 0;
  let accountOpening = 0;
  let platformNet = 0;
  for (const r of rows) {
    income += Number(r.gross_earnings ?? 0);
    tips += Number(r.tips ?? 0);
    const f = Number(r.platform_fee ?? 0);
    feeSigned += f;
    feeAbs += Math.abs(f);
    dailyCash += Number(r.daily_cash ?? 0);
    accountOpening += Number(r.account_opening_fee ?? 0);
    platformNet += Number(r.net_earnings ?? 0);
  }
  return { income, tips, feeSigned, feeAbs, dailyCash, accountOpening, platformNet };
}

/**
 * Payout before vehicle rent: Net − commission − |cash deduction| − |account opening|.
 * Glovo: cash deduction = Cash received from Clients.
 * Bolt: cash deduction = Overdue courier cash debt (stored in earnings_records.daily_cash).
 */
export function computePayoutBeforeRent(params: {
  platformNet: number;
  companyCommission: number;
  /** Glovo daily cash or Bolt overdue courier cash debt (earnings_records.daily_cash). */
  cashDeduction: number;
  accountOpeningFee: number;
}): number {
  return roundMoney(
    params.platformNet -
      params.companyCommission -
      roundMoney(Math.abs(params.cashDeduction)) -
      roundMoney(Math.abs(params.accountOpeningFee)),
  );
}

/** Debt baseline on driver_payouts: computePayoutBeforeRent(...) − rent (see migration 071 + payoutRentEntries sync). */
export function computeRawNetAmountForDebt(params: {
  payoutBeforeRent: number;
  vehicleRent: number;
}): number {
  return roundMoney(params.payoutBeforeRent - roundMoney(Math.max(0, params.vehicleRent)));
}

/** Recompute one weekly driver_payouts row for a single earnings platform. */
export async function recomputeDriverPayoutRollup(
  client: PoolClient,
  orgId: string,
  driver: DriverMatchRow & { id: string },
  periodStart: string,
  periodEnd: string,
  earningsPlatform: EarningsPlatform,
): Promise<string | null> {
  const payoutPlatform: DriverPayoutPlatform = payoutPlatformFromEarnings(earningsPlatform);

  const sumRes = await client.query<{
    gross_earnings: string | null;
    tips: string | null;
    platform_fee: string | null;
    daily_cash: string | null;
    account_opening_fee: string | null;
    net_earnings: string | null;
  }>(
    `SELECT SUM(COALESCE(er.gross_earnings, 0))::text AS gross_earnings,
            SUM(COALESCE(er.tips, 0))::text AS tips,
            SUM(
              CASE
                WHEN er.platform IN ('glovo', 'uber', 'bolt_taxi') THEN ABS(COALESCE(er.platform_fee, 0))
                ELSE 0
              END
            )::text AS platform_fee,
            SUM(COALESCE(er.daily_cash, 0))::text AS daily_cash,
            SUM(
              CASE
                WHEN er.platform = 'glovo' THEN ABS(COALESCE(er.account_opening_fee, 0))
                ELSE 0
              END
            )::text AS account_opening_fee,
            SUM(COALESCE(er.net_earnings, 0))::text AS net_earnings
       FROM earnings_records er
       INNER JOIN earnings_imports ei ON ei.id = er.import_id AND ei.organization_id = $1::uuid
      WHERE er.driver_id = $2::uuid
        AND er.platform = $3
        AND (
          (er.trip_date >= $4::date AND er.trip_date <= $5::date)
          OR (ei.week_start = $4::date AND ei.week_end = $5::date)
        )`,
    [orgId, driver.id, earningsPlatform, periodStart, periodEnd],
  );

  const countRes = await client.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c
       FROM earnings_records er
       INNER JOIN earnings_imports ei ON ei.id = er.import_id AND ei.organization_id = $1::uuid
      WHERE er.driver_id = $2::uuid
        AND er.platform = $3
        AND (
          (er.trip_date >= $4::date AND er.trip_date <= $5::date)
          OR (ei.week_start = $4::date AND ei.week_end = $5::date)
        )`,
    [orgId, driver.id, earningsPlatform, periodStart, periodEnd],
  );
  if (parseInt(countRes.rows[0]?.c ?? "0", 10) === 0) return null;

  const sumRow = sumRes.rows[0] ?? {
    gross_earnings: "0",
    tips: "0",
    platform_fee: "0",
    daily_cash: "0",
    account_opening_fee: "0",
    net_earnings: "0",
  };

  const totals = aggregateEarningsPeriodTotals([sumRow]);
  const platformNet = roundMoney(totals.platformNet);
  const grossIncome = roundMoney(totals.income + totals.tips);
  const comm = computeCompanyCommissionFromBase(driver, platformNet, {
    allowNegativeBase: platformNet < 0,
  });
  const commissionRate = driverCommissionRateAsFraction(driver);
  const platformId = payoutPlatformIdForDriver(driver, earningsPlatform);
  let accountOpening = roundMoney(Math.abs(totals.accountOpening));
  /** Bolt: fees are VAT gap, not platform service fee. Uber: store fee sum for reporting; payout math uses platform net only. */
  let feeAbs = roundMoney(totals.feeAbs);
  if (payoutPlatform === "bolt") {
    accountOpening = 0;
    feeAbs = 0;
  } else if (payoutPlatform === "uber" || payoutPlatform === "bolt_taxi") {
    accountOpening = 0;
    feeAbs = roundMoney(totals.feeAbs);
  }
  const payoutBeforeRent = computePayoutBeforeRent({
    platformNet,
    companyCommission: comm.company_commission,
    cashDeduction: totals.dailyCash,
    accountOpeningFee: accountOpening,
  });
  const driverPayout = payoutBeforeRent;

  /** Vehicle rent once per driver/week: on glovo row, or on bolt when no glovo earnings in period. */
  const glovoInPeriod = await client.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c
       FROM earnings_records er
       INNER JOIN earnings_imports ei ON ei.id = er.import_id AND ei.organization_id = $1::uuid
      WHERE er.driver_id = $2::uuid
        AND er.platform = 'glovo'
        AND (
          (er.trip_date >= $3::date AND er.trip_date <= $4::date)
          OR (ei.week_start = $3::date AND ei.week_end = $4::date)
        )`,
    [orgId, driver.id, periodStart, periodEnd],
  );
  const hasGlovoEarnings = parseInt(glovoInPeriod.rows[0]?.c ?? "0", 10) > 0;
  const chargeVehicleRent = payoutPlatform === "glovo" || !hasGlovoEarnings;

  const upsertRes = await client.query<{ id: string }>(
    `INSERT INTO driver_payouts (
        organization_id, driver_id, platform, platform_id, payment_period_start, payment_period_end,
        income, tips, total_platform_fees, total_net_earnings,
        total_daily_cash, account_opening_fee,
        company_commission, raw_net_amount, net_driver_payout, debt_amount, debt_applied_amount, remaining_debt_amount,
        vehicle_rental_fee, payment_status,
        gross_income, net_income, commission_base, commission_rate, commission_base_type
      ) VALUES (
        $1::uuid, $2::uuid, $3, $4, $5::date, $6::date,
        $7, $8, $9, $10,
        $11, $12,
        $13,
        ROUND((
          $10::numeric - $13::numeric - ABS($11::numeric) - ABS($12::numeric)
          - CASE WHEN $19::boolean THEN calculate_rental_fee($1::uuid, $2::uuid, $5::date, $6::date) ELSE 0 END
        )::numeric, 2),
        ROUND((
          $14::numeric - CASE WHEN $19::boolean THEN calculate_rental_fee($1::uuid, $2::uuid, $5::date, $6::date) ELSE 0 END
        )::numeric, 2),
        0, 0, 0,
        CASE WHEN $19::boolean THEN calculate_rental_fee($1::uuid, $2::uuid, $5::date, $6::date) ELSE 0 END,
        'pending',
        $15, $16, $17, $18, 'net_income'
      )
      ON CONFLICT (organization_id, driver_id, platform, payment_period_start, payment_period_end)
      DO UPDATE SET
        platform_id = COALESCE(driver_payouts.platform_id, EXCLUDED.platform_id),
        income = EXCLUDED.income,
        tips = EXCLUDED.tips,
        total_platform_fees = EXCLUDED.total_platform_fees,
        total_net_earnings = EXCLUDED.total_net_earnings,
        total_daily_cash = EXCLUDED.total_daily_cash,
        account_opening_fee = EXCLUDED.account_opening_fee,
        company_commission = EXCLUDED.company_commission,
        raw_net_amount = ROUND((
          EXCLUDED.total_net_earnings::numeric
          - EXCLUDED.company_commission::numeric
          - ABS(EXCLUDED.total_daily_cash::numeric)
          - ABS(EXCLUDED.account_opening_fee::numeric)
          - CASE WHEN $19::boolean THEN calculate_rental_fee($1::uuid, EXCLUDED.driver_id, EXCLUDED.payment_period_start::date, EXCLUDED.payment_period_end::date) ELSE 0 END
        )::numeric, 2),
        vehicle_rental_fee = CASE WHEN $19::boolean THEN calculate_rental_fee($1::uuid, EXCLUDED.driver_id, EXCLUDED.payment_period_start::date, EXCLUDED.payment_period_end::date) ELSE 0 END,
        gross_income = EXCLUDED.gross_income,
        net_income = EXCLUDED.net_income,
        commission_base = EXCLUDED.commission_base,
        commission_rate = EXCLUDED.commission_rate,
        commission_base_type = EXCLUDED.commission_base_type,
        net_driver_payout = EXCLUDED.net_driver_payout
      RETURNING id::text`,
    [
      orgId,
      driver.id,
      payoutPlatform,
      platformId,
      periodStart,
      periodEnd,
      roundMoney(totals.income),
      roundMoney(totals.tips),
      feeAbs,
      platformNet,
      roundMoney(totals.dailyCash),
      accountOpening,
      roundMoney(comm.company_commission),
      driverPayout,
      grossIncome,
      platformNet,
      platformNet,
      commissionRate,
      chargeVehicleRent,
    ],
  );

  const payoutId = upsertRes.rows[0]?.id;
  if (!payoutId) return null;
  if (chargeVehicleRent) {
    await syncPayoutRentEntries(client, orgId, payoutId);
  } else {
    await client.query(
      `UPDATE driver_payouts SET vehicle_rental_fee = 0 WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [payoutId, orgId],
    );
  }
  await applyCustomFeesToRawNet(client, orgId, payoutId);
  await applyDebtCarryForward(client, orgId, payoutId);
  return payoutId;
}

export function isBoltWeeklyImportMeta(meta: unknown): boolean {
  return (
    !!meta &&
    typeof meta === "object" &&
    (meta as Record<string, unknown>).boltWeeklyExport === true
  );
}

const EARNINGS_IN_PERIOD_SQL = `
  SELECT DISTINCT er.driver_id::text AS driver_id
    FROM earnings_records er
    INNER JOIN earnings_imports ei ON ei.id = er.import_id AND ei.organization_id = $1::uuid
   WHERE er.platform = $2
     AND (
       (er.trip_date >= $3::date AND er.trip_date <= $4::date)
       OR (ei.week_start = $3::date AND ei.week_end = $4::date)
     )`;

/**
 * Rebuild driver_payouts for every driver with earnings in the payment week (e.g. after fixing rollup SQL).
 */
export async function recomputeDriverPayoutsForPaymentWeek(
  client: PoolClient,
  orgId: string,
  driverById: Map<string, DriverMatchRow & { id: string }>,
  periodStart: string,
  periodEnd: string,
  earningsPlatform: EarningsPlatform,
): Promise<number> {
  const { rows } = await client.query<{ driver_id: string }>(EARNINGS_IN_PERIOD_SQL, [
    orgId,
    earningsPlatform,
    periodStart,
    periodEnd,
  ]);
  let count = 0;
  for (const { driver_id: driverId } of rows) {
    const drv = driverById.get(driverId);
    if (!drv) continue;
    const id = await recomputeDriverPayoutRollup(
      client,
      orgId,
      { ...drv, id: driverId },
      periodStart,
      periodEnd,
      earningsPlatform,
    );
    if (id) count += 1;
  }
  return count;
}
