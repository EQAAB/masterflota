import type { ConsolidatedDriverPayout, PayoutListItem } from "../../../api/earnings";
import { toNum } from "./payoutRowUtils";

export type PlatformBreakdownLine = {
  payoutId: string;
  platform: string;
  platformLabel: string;
  baseIncome: number;
  tips: number;
  gross: number;
  platformFees: number;
  /** Platform net after fees (earnings base for commission & payout). */
  netIncome: number;
  fleetSub: number;
  cashBalance: number;
  accountOpeningFee: number;
  /** net_income − fleet commission − cash − opening fee (matches backend driver_payout). */
  netPayoutFromPlatform: number;
  /** gross − platformFees − netIncome when platform reports net differently (e.g. Bolt). */
  platformNetAdjustment: number;
  /** Stored payable on the platform leg (after vehicle rent / debt on that row). */
  storedNetDriverPayout: number;
  /** Raw net after rent/fees on this platform leg (before debt allocation). */
  rawNet: number;
  /** Platform had negative raw net this week (debt leg). */
  isDebtPlatform: boolean;
  commissionBase: number;
  commissionRate: number;
  commissionCharged: number;
};

export type UnifiedPayoutBreakdown = {
  platforms: PlatformBreakdownLine[];
  totalGross: number;
  totalPlatformFees: number;
  /** gross − fees − net_income when platforms report net differently from gross − taxa. */
  totalPlatformNetAdjustment: number;
  totalNetIncome: number;
  totalFleetSub: number;
  /** Sum(net_income) − fleet commission, before cash. */
  netAfterFleetBeforeCash: number;
  totalCashBalance: number;
  /** Sum of per-platform net_income − commission − cash − opening fee. */
  totalNetPayoutAllPlatforms: number;
  /** Custom fee / vehicle rent applied once on combined platform net. */
  customFeeVehicleRent: number;
  /** Combined platform net minus vehicle rent / custom fee. */
  amountAfterVehicleRent: number;
  /** Total gap between amount after vehicle rent and stored final payout. */
  otherDeductions: number;
  /** Debt applied from this period's earnings to older debt rows. */
  totalDebtApplied: number;
  /** Current-period deficit when raw net is negative (new debt on driver). */
  newPeriodDebt: number;
  /** Residual adjustments (custom fees, per-platform allocation, rounding). */
  otherAdjustments: number;
  /** Sum of positive platform raw nets this week. */
  totalPositiveRaw: number;
  /** Sum of negative platform raw nets this week (negative number). */
  totalNegativeRaw: number;
  /** Pooled raw net across all platforms (earnings − platform debt). */
  weekRawNet: number;
  /** Same-week debt offset by positive platforms. */
  crossPlatformDebtOffset: number;
  debtPlatforms: string[];
  /** Operational platform net minus pooled raw net (recurring fees, custom charges). */
  weeklyChargesDelta: number;
  /** Authoritative total from consolidated payout (sum of net_driver_payout). */
  finalNet: number;
  /** True when stored final matches the computed ladder within 0.02 RON. */
  isReconciled: boolean;
  payoutId: string;
};

function platformShortId(platform: string, payoutId: string): string {
  const prefix = platform.replace(/_/g, "-").toUpperCase().slice(0, 8);
  const tail = payoutId.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `${prefix}-${tail}`;
}

export { platformShortId };

export function formatConsolidatedPeriod(row: ConsolidatedDriverPayout): string {
  const parts = formatPeriodParts(row.payment_period_start, row.payment_period_end);
  if (!parts) return `${row.payment_period_start} – ${row.payment_period_end}`;
  return `${parts.range}, ${parts.year}`;
}

export function formatPeriodParts(
  startIso: string,
  endIso: string,
): { range: string; year: string } | null {
  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
  const start = new Date(`${startIso.slice(0, 10)}T12:00:00`);
  const end = new Date(`${endIso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return {
    range: `${fmt.format(start)} – ${fmt.format(end)}`,
    year: String(start.getFullYear()),
  };
}

/** Matches backend: net_income − company_commission − |cash| − |opening fee|. */
export function computePlatformNetPayout(p: PayoutListItem): number {
  const netIncome = toNum(p.net_income);
  const fleetSub = toNum(p.company_commission);
  const cashBalance = round2(Math.abs(toNum(p.total_daily_cash)));
  const accountOpeningFee = round2(Math.abs(toNum(p.account_opening_fee)));
  return round2(netIncome - fleetSub - cashBalance - accountOpeningFee);
}

export function computeUnifiedBreakdown(
  row: ConsolidatedDriverPayout,
  payoutItems: PayoutListItem[],
): UnifiedPayoutBreakdown {
  const platforms: PlatformBreakdownLine[] = payoutItems.map((p) => {
    const gross = toNum(p.total_gross_earnings);
    const platformFees = toNum(p.total_platform_fees);
    const netIncome = toNum(p.net_income);
    const fleetSub = toNum(p.company_commission);
    const cashBalance = round2(Math.abs(toNum(p.total_daily_cash)));
    const accountOpeningFee = round2(Math.abs(toNum(p.account_opening_fee)));
    const platformNetAdjustment = round2(gross - platformFees - netIncome);
    const rawNet = round2(toNum(p.raw_net_amount));
    return {
      payoutId: p.id,
      platform: p.earnings_platform ?? "unknown",
      platformLabel: (p.earnings_platform ?? "unknown").replace(/_/g, " "),
      baseIncome: toNum(p.income),
      tips: toNum(p.tips),
      gross,
      platformFees,
      netIncome,
      fleetSub,
      cashBalance,
      accountOpeningFee,
      netPayoutFromPlatform: computePlatformNetPayout(p),
      platformNetAdjustment,
      storedNetDriverPayout: round2(toNum(p.net_driver_payout)),
      rawNet,
      isDebtPlatform: rawNet < -0.02,
      commissionBase: toNum(p.commission_base),
      commissionRate: toNum(p.commission_rate),
      commissionCharged: fleetSub,
    };
  });

  const totalGross = round2(platforms.reduce((s, l) => s + l.gross, 0));
  const totalPlatformFees = round2(platforms.reduce((s, l) => s + l.platformFees, 0));
  const totalNetIncome = round2(platforms.reduce((s, l) => s + l.netIncome, 0));
  const totalPlatformNetAdjustment = round2(totalGross - totalPlatformFees - totalNetIncome);
  const totalFleetSub = round2(platforms.reduce((s, l) => s + l.fleetSub, 0));
  const netAfterFleetBeforeCash = round2(totalNetIncome - totalFleetSub);
  const totalCashBalance = round2(platforms.reduce((s, l) => s + l.cashBalance, 0));
  const totalNetPayoutAllPlatforms = round2(
    platforms.reduce((s, l) => s + l.netPayoutFromPlatform, 0),
  );

  const customFeeVehicleRent = round2(
    payoutItems.reduce((m, p) => Math.max(m, toNum(p.vehicle_rental_fee)), 0),
  );

  const amountAfterVehicleRent = round2(
    Math.max(0, totalNetPayoutAllPlatforms - customFeeVehicleRent),
  );

  const totalPositiveRaw = round2(
    platforms.reduce((s, l) => (l.rawNet > 0.02 ? s + l.rawNet : s), 0),
  );
  const totalNegativeRaw = round2(
    platforms.reduce((s, l) => (l.rawNet < -0.02 ? s + l.rawNet : s), 0),
  );
  const weekRawNet = round2(totalPositiveRaw + totalNegativeRaw);
  const crossPlatformDebtOffset = round2(
    toNum(row.total_debt_offset) > 0
      ? toNum(row.total_debt_offset)
      : Math.min(totalPositiveRaw, Math.abs(totalNegativeRaw)),
  );
  const debtPlatforms =
    row.debt_platforms?.length
      ? row.debt_platforms
      : platforms.filter((l) => l.isDebtPlatform).map((l) => l.platform);

  /** Authoritative — same source as consolidated payouts list / pay action. */
  const finalNet = round2(toNum(row.total_amount));
  const otherDeductions = round2(Math.max(0, amountAfterVehicleRent - finalNet));
  const totalDebtApplied = round2(
    payoutItems.reduce((s, p) => s + toNum(p.debt_applied_amount), 0),
  );
  const newPeriodDebt = weekRawNet < -0.02 ? round2(Math.abs(weekRawNet)) : 0;
  const weeklyChargesDelta = round2(weekRawNet - totalNetPayoutAllPlatforms);
  const otherAdjustments = round2(Math.max(0, otherDeductions - totalDebtApplied - newPeriodDebt));
  const isReconciled =
    Math.abs(weekRawNet - totalDebtApplied - otherAdjustments - finalNet) < 0.05;

  const payoutId = row.driver_payment_id ?? row.platform_payout_ids[0] ?? "—";

  return {
    platforms,
    totalGross,
    totalPlatformFees,
    totalPlatformNetAdjustment,
    totalNetIncome,
    totalFleetSub,
    netAfterFleetBeforeCash,
    totalCashBalance,
    totalNetPayoutAllPlatforms,
    customFeeVehicleRent,
    amountAfterVehicleRent,
    otherDeductions,
    totalDebtApplied,
    newPeriodDebt,
    otherAdjustments,
    totalPositiveRaw,
    totalNegativeRaw,
    weekRawNet,
    crossPlatformDebtOffset,
    debtPlatforms,
    weeklyChargesDelta,
    finalNet,
    isReconciled,
    payoutId,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
