import type { ConsolidatedDriverPayout, PayoutListItem } from "../../../api/earnings";
import { formatRatePctFromFraction, toNum } from "./payoutRowUtils";

export type PlatformBreakdownLine = {
  payoutId: string;
  platform: string;
  platformLabel: string;
  baseIncome: number;
  tips: number;
  gross: number;
  platformFees: number;
  fleetSub: number;
  netFromPlatform: number;
  commissionBase: number;
  commissionRate: number;
  commissionCharged: number;
};

export type UnifiedPayoutBreakdown = {
  platforms: PlatformBreakdownLine[];
  totalGross: number;
  totalPlatformFees: number;
  totalFleetSub: number;
  combinedNetBeforeRent: number;
  vehicleRent: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  otherDeductions: number;
  finalNet: number;
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

export function computeUnifiedBreakdown(
  row: ConsolidatedDriverPayout,
  payoutItems: PayoutListItem[],
): UnifiedPayoutBreakdown {
  const platforms: PlatformBreakdownLine[] = payoutItems.map((p) => {
    const gross = toNum(p.total_gross_earnings);
    const platformFees = toNum(p.total_platform_fees);
    const fleetSub = toNum(p.company_commission);
    const netFromPlatform = round2(gross - platformFees - fleetSub);
    return {
      payoutId: p.id,
      platform: p.earnings_platform ?? "unknown",
      platformLabel: (p.earnings_platform ?? "unknown").replace(/_/g, " "),
      baseIncome: toNum(p.income),
      tips: toNum(p.tips),
      gross,
      platformFees,
      fleetSub,
      netFromPlatform,
      commissionBase: toNum(p.net_income),
      commissionRate: toNum(p.commission_rate),
      commissionCharged: fleetSub,
    };
  });

  const totalGross = round2(platforms.reduce((s, l) => s + l.gross, 0));
  const totalPlatformFees = round2(platforms.reduce((s, l) => s + l.platformFees, 0));
  const totalFleetSub = round2(platforms.reduce((s, l) => s + l.fleetSub, 0));
  const combinedNetBeforeRent = round2(platforms.reduce((s, l) => s + l.netFromPlatform, 0));

  const vehicleRent = round2(
    payoutItems.reduce((m, p) => Math.max(m, toNum(p.vehicle_rental_fee)), 0),
  );

  const taxableAmount = round2(Math.max(0, combinedNetBeforeRent - vehicleRent));
  const anchor = payoutItems[0];
  const taxRate = anchor ? toNum(anchor.commission_rate) : 0;
  const nominalTax = taxRate > 0 ? round2(taxableAmount * (taxRate <= 1 ? taxRate : taxRate / 100)) : 0;

  const finalNet = round2(toNum(row.total_amount));
  const otherDeductions = round2(
    Math.max(0, combinedNetBeforeRent - vehicleRent - nominalTax - finalNet),
  );
  const taxAmount =
    otherDeductions > 0.02
      ? round2(Math.max(0, combinedNetBeforeRent - vehicleRent - otherDeductions - finalNet))
      : nominalTax;

  const payoutId = row.driver_payment_id ?? row.platform_payout_ids[0] ?? "—";

  return {
    platforms,
    totalGross,
    totalPlatformFees,
    totalFleetSub,
    combinedNetBeforeRent,
    vehicleRent,
    taxableAmount,
    taxRate,
    taxAmount,
    otherDeductions,
    finalNet,
    payoutId,
  };
}

export function tableTaxDisplay(row: ConsolidatedDriverPayout): number | null {
  const gross = toNum(row.total_gross);
  const fleet = toNum(row.total_fees);
  const platformFees = toNum(row.total_platform_fees ?? "0");
  const vehicleRent = toNum(row.total_vehicle_rent ?? "0");
  const net = toNum(row.total_amount);
  if (platformFees <= 0 && vehicleRent <= 0) return null;
  return round2(Math.max(0, gross - platformFees - fleet - vehicleRent - net));
}

export function tableTaxRateLabel(items: PayoutListItem[]): string {
  const rate = items[0] ? toNum(items[0].commission_rate) : 0;
  if (rate <= 0) return "Taxes";
  return `Taxes (${formatRatePctFromFraction(rate)})`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
