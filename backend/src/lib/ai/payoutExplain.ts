import type { PoolClient } from "pg";
import { AiDisabledError, AiRateLimitError, chatJsonCompletion } from "./openaiClient";
import { PAYOUT_EXPLAIN_SYSTEM } from "./prompts";
import {
  listConsolidatedPayouts,
  type ConsolidatedDriverPayoutRow,
} from "../../modules/earnings/consolidatedPayouts";
import { roundMoney } from "../../modules/earnings/debtAllocation";

export const PAYOUT_EXPLAIN_DISCLAIMER =
  "Calculated by Fleet Manager rules; AI only explains.";

export const PAYOUT_EXPLAIN_LIMIT_DISCLAIMER =
  "Calculated by Fleet Manager rules. AI explanation skipped due to rate limits.";

export type PayoutExplainBreakdown = {
  driverId: string;
  driverName: string;
  weekStart: string;
  weekEnd: string;
  currency: string;
  status: string;
  finalNet: number;
  totalGross: number;
  totalPlatformFees: number;
  totalCommission: number;
  totalCash: number;
  totalAccountOpeningFee: number;
  totalVehicleRent: number;
  debtApplied: number;
  remainingDebt: number;
  debtOffset: number;
  outstandingLoan: number;
  platforms: Array<{
    platform: string;
    gross: number;
    platformFees: number;
    netIncome: number;
    commission: number;
    cash: number;
    accountOpeningFee: number;
    vehicleRent: number;
    rawNet: number;
    netDriverPayout: number;
    paymentStatus: string;
  }>;
};

function num(v: string | null | undefined): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? roundMoney(n) : 0;
}

export function buildExplainBreakdownFromConsolidated(
  row: ConsolidatedDriverPayoutRow,
  legs: Array<{
    platform: string | null;
    total_gross_earnings: string | null;
    total_platform_fees: string | null;
    net_income: string | null;
    company_commission: string | null;
    total_daily_cash: string | null;
    account_opening_fee: string | null;
    vehicle_rental_fee: string | null;
    raw_net_amount: string | null;
    net_driver_payout: string | null;
    payment_status: string;
  }>,
): PayoutExplainBreakdown {
  const platforms = legs.map((leg) => ({
    platform: leg.platform ?? "unknown",
    gross: num(leg.total_gross_earnings),
    platformFees: num(leg.total_platform_fees),
    netIncome: num(leg.net_income),
    commission: num(leg.company_commission),
    cash: Math.abs(num(leg.total_daily_cash)),
    accountOpeningFee: Math.abs(num(leg.account_opening_fee)),
    vehicleRent: num(leg.vehicle_rental_fee),
    rawNet: num(leg.raw_net_amount),
    netDriverPayout: num(leg.net_driver_payout),
    paymentStatus: leg.payment_status,
  }));

  return {
    driverId: row.driver_id,
    driverName: `${row.first_name} ${row.last_name}`.trim(),
    weekStart: row.payment_period_start.slice(0, 10),
    weekEnd: row.payment_period_end.slice(0, 10),
    currency: "RON",
    status: row.consolidated_status,
    finalNet: num(row.total_amount),
    totalGross: num(row.total_gross),
    totalPlatformFees: num(row.total_platform_fees),
    totalCommission: roundMoney(platforms.reduce((s, p) => s + p.commission, 0)),
    totalCash: roundMoney(platforms.reduce((s, p) => s + p.cash, 0)),
    totalAccountOpeningFee: roundMoney(
      platforms.reduce((s, p) => s + p.accountOpeningFee, 0),
    ),
    totalVehicleRent: num(row.total_vehicle_rent),
    debtApplied: num(row.debt_applied_total),
    remainingDebt: num(row.remaining_debt),
    debtOffset: num(row.total_debt_offset),
    outstandingLoan: num(row.outstanding_loan_balance),
    platforms,
  };
}

export async function loadPayoutExplainBreakdown(
  client: PoolClient,
  orgId: string,
  driverId: string,
  weekStart: string,
  weekEnd: string,
): Promise<PayoutExplainBreakdown | null> {
  const items = await listConsolidatedPayouts(client, orgId, weekStart, weekEnd, {
    driverId,
  });
  const row = items[0];
  if (!row) return null;

  const legsRes = await client.query<{
    platform: string | null;
    total_gross_earnings: string | null;
    total_platform_fees: string | null;
    net_income: string | null;
    company_commission: string | null;
    total_daily_cash: string | null;
    account_opening_fee: string | null;
    vehicle_rental_fee: string | null;
    raw_net_amount: string | null;
    net_driver_payout: string | null;
    payment_status: string;
  }>(
    `SELECT platform,
            total_gross_earnings::text,
            total_platform_fees::text,
            net_income::text,
            company_commission::text,
            total_daily_cash::text,
            account_opening_fee::text,
            vehicle_rental_fee::text,
            raw_net_amount::text,
            net_driver_payout::text,
            payment_status
     FROM driver_payouts
     WHERE organization_id = $1
       AND driver_id = $2::uuid
       AND payment_period_start = $3::date
       AND payment_period_end = $4::date
     ORDER BY platform`,
    [orgId, driverId, weekStart, weekEnd],
  );

  return buildExplainBreakdownFromConsolidated(row, legsRes.rows);
}

export type PayoutExplainResult = {
  summary: string;
  bullets: string[];
  disclaimer: string;
  breakdown: PayoutExplainBreakdown;
  aiEnabled: boolean;
  cached?: boolean;
  aiSkipped?: boolean;
};

export function buildRuleBasedPayoutExplain(
  breakdown: PayoutExplainBreakdown,
  opts?: { aiSkipped?: boolean },
): PayoutExplainResult {
  const c = breakdown.currency;
  const bullets: string[] = [
    `Gross earnings: ${breakdown.totalGross.toFixed(2)} ${c}`,
    `Platform fees: ${breakdown.totalPlatformFees.toFixed(2)} ${c}`,
    `Company commission: ${breakdown.totalCommission.toFixed(2)} ${c}`,
  ];
  if (breakdown.totalCash > 0.02) {
    bullets.push(`Cash collected: ${breakdown.totalCash.toFixed(2)} ${c}`);
  }
  if (breakdown.totalAccountOpeningFee > 0.02) {
    bullets.push(`Account opening fee: ${breakdown.totalAccountOpeningFee.toFixed(2)} ${c}`);
  }
  if (breakdown.totalVehicleRent > 0.02) {
    bullets.push(`Vehicle rent: ${breakdown.totalVehicleRent.toFixed(2)} ${c}`);
  }
  if (breakdown.debtOffset > 0.02) {
    bullets.push(`Cross-platform debt offset: ${breakdown.debtOffset.toFixed(2)} ${c}`);
  }
  if (breakdown.debtApplied > 0.02) {
    bullets.push(`Debt applied from prior weeks: ${breakdown.debtApplied.toFixed(2)} ${c}`);
  }
  if (breakdown.remainingDebt > 0.02) {
    bullets.push(`Remaining debt: ${breakdown.remainingDebt.toFixed(2)} ${c}`);
  }
  if (breakdown.outstandingLoan > 0.02) {
    bullets.push(`Outstanding loan balance: ${breakdown.outstandingLoan.toFixed(2)} ${c}`);
  }
  bullets.push(`Final net: ${breakdown.finalNet.toFixed(2)} ${c}`);

  return {
    summary: `Net payout for ${breakdown.driverName} (${breakdown.weekStart} – ${breakdown.weekEnd}) is ${breakdown.finalNet.toFixed(2)} ${c}.`,
    bullets,
    disclaimer: opts?.aiSkipped ? PAYOUT_EXPLAIN_LIMIT_DISCLAIMER : PAYOUT_EXPLAIN_DISCLAIMER,
    breakdown,
    aiEnabled: false,
    aiSkipped: opts?.aiSkipped === true,
  };
}

export async function explainPayoutBreakdown(
  breakdown: PayoutExplainBreakdown,
): Promise<PayoutExplainResult> {
  try {
    const raw = await chatJsonCompletion({
      system: PAYOUT_EXPLAIN_SYSTEM,
      user: JSON.stringify(breakdown),
      maxTokens: 900,
    });

    let parsed: { summary?: unknown; bullets?: unknown };
    try {
      parsed = JSON.parse(raw) as { summary?: unknown; bullets?: unknown };
    } catch {
      throw new Error("Failed to parse AI payout explanation");
    }

    const summary =
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : `Net payout for ${breakdown.driverName} (${breakdown.weekStart} – ${breakdown.weekEnd}) is ${breakdown.finalNet.toFixed(2)} ${breakdown.currency}.`;

    let bullets = Array.isArray(parsed.bullets)
      ? parsed.bullets
          .filter((b): b is string => typeof b === "string" && b.trim().length > 0)
          .map((b) => b.trim())
      : [];

    if (bullets.length === 0) {
      return {
        ...buildRuleBasedPayoutExplain(breakdown),
        summary,
        aiEnabled: true,
      };
    }

    return {
      summary,
      bullets,
      disclaimer: PAYOUT_EXPLAIN_DISCLAIMER,
      breakdown,
      aiEnabled: true,
    };
  } catch (err) {
    if (err instanceof AiRateLimitError) {
      return buildRuleBasedPayoutExplain(breakdown, { aiSkipped: true });
    }
    throw err;
  }
}

export { AiDisabledError, AiRateLimitError };
