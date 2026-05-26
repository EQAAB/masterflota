import type { PayoutListItem, PayoutRentEntry } from "../../../api/earnings";
import { formatCurrency } from "../../../utils/currency";
import { commissionBaseTypeLabel } from "../../../utils/commissionBaseLabels";
import { earningsPlatformLabel } from "../../../utils/earningsPlatformLabel";

export function periodLabel(row: PayoutListItem): string {
  const start = row.payment_period_start?.slice(0, 10) ?? "—";
  const end = row.payment_period_end?.slice(0, 10) ?? "—";
  const plat = row.earnings_platform?.trim()
    ? ` · ${earningsPlatformLabel(row.earnings_platform)}`
    : "";
  return `${start} – ${end}${plat}`;
}

export function toNum(value: string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeRentEntries(raw: PayoutListItem["rent_entries"]): PayoutRentEntry[] {
  if (raw == null || !Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is PayoutRentEntry =>
      typeof x === "object" &&
      x != null &&
      typeof (x as PayoutRentEntry).entry_type === "string" &&
      typeof (x as PayoutRentEntry).amount === "string",
  );
}

export function rentEntryTypeLabel(t: string): string {
  switch (t) {
    case "current_week":
      return "This week";
    case "overdue":
      return "Overdue (prior week)";
    case "adjustment":
      return "Adjustment";
    default:
      return t;
  }
}

export function formatRatePctFromFraction(rNum: number): string {
  if (!(rNum > 0)) return "—";
  if (rNum <= 1) return `${(rNum * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
  return `${rNum}%`;
}

export function payoutCommissionTitle(row: PayoutListItem): string {
  const comp = toNum(row.company_commission);
  const base = toNum(row.commission_base);
  const rNum = toNum(row.commission_rate);
  const pct = formatRatePctFromFraction(rNum);
  const nominal = base > 0 && rNum > 0 && rNum <= 1 ? base * rNum : 0;
  const extra =
    base > 0.001 && nominal > 0 && Math.abs(comp - nominal) > 0.02
      ? `\nEffective on base: ${((comp / base) * 100).toFixed(2).replace(/\.?0+$/, "")}%`
      : "";
  return `Fleet commission: ${formatCurrency(comp)}\nBase: ${formatCurrency(base)} (${commissionBaseTypeLabel(row.commission_base_type)})\nNominal rate: ${pct}${extra}`;
}

export function boltPayoutCashDeductionLabel(row: PayoutListItem): string {
  return row.earnings_platform === "bolt"
    ? "Overdue courier cash debt"
    : "Daily cash deduction";
}

export function payoutGlovoBreakdownTitle(row: PayoutListItem): string | undefined {
  const ni = row.net_income;
  if (ni == null || ni === "") return undefined;
  const rNum = toNum(row.commission_rate);
  const pctLabel = formatRatePctFromFraction(rNum);
  const baseLabel = commissionBaseTypeLabel(row.commission_base_type);
  const cashLabel = boltPayoutCashDeductionLabel(row);
  return [
    `Base income: ${formatCurrency(toNum(row.income))}`,
    `Tips: ${formatCurrency(toNum(row.tips))}`,
    `Gross (Income + Tips): ${formatCurrency(toNum(row.total_gross_earnings))}`,
    `Platform fees (Taxa): ${formatCurrency(toNum(row.total_platform_fees))}`,
    `Net income: ${formatCurrency(toNum(row.net_income))}`,
    `Commission base (${baseLabel}): ${formatCurrency(toNum(row.commission_base))}`,
    `Nominal commission rate: ${pctLabel}`,
    `Commission (fleet): ${formatCurrency(toNum(row.company_commission))}`,
    `${cashLabel}: ${formatCurrency(Math.abs(toNum(row.total_daily_cash)))} (stored sum may be signed)`,
    `Account opening fee deduction: ${formatCurrency(Math.abs(toNum(row.account_opening_fee)))}`,
    `Vehicle rent (fleet week prorated): ${formatCurrency(toNum(row.vehicle_rental_fee))}`,
    `Raw period roll-up (after opening fee and vehicle rent): ${formatCurrency(toNum(row.raw_net_amount))}`,
    `Net payable: ${formatCurrency(toNum(row.net_driver_payout))}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function vehicleRentDetailTitle(row: PayoutListItem): string | undefined {
  const entries = normalizeRentEntries(row.rent_entries);
  const total = toNum(row.vehicle_rental_fee);
  if (!entries.length && total === 0) return undefined;
  if (!entries.length) return `Vehicle rent: ${formatCurrency(total)}`;
  return [
    `Vehicle rent total: ${formatCurrency(total)}`,
    ...entries.map((e) => {
      const desc = e.description ? ` — ${e.description}` : "";
      return `• ${rentEntryTypeLabel(e.entry_type)}: ${formatCurrency(Number(e.amount) || 0)}${desc}`;
    }),
  ].join("\n");
}

export function includesQuery(value: string | null | undefined, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return String(value ?? "").toLowerCase().includes(q);
}

export function findPayoutRow(allRows: PayoutListItem[], id: string): PayoutListItem | undefined {
  return allRows.find((r) => r.id === id);
}

export function isDebtStyleRow(row: PayoutListItem): boolean {
  return row.payment_status === "debt" || toNum(row.raw_net_amount) < 0;
}

export function isPayablePayoutRow(row: PayoutListItem): boolean {
  if (row.subcontractor_id || row.subcontractor_payout_id) return false;
  const debtLike = row.payment_status === "debt" || toNum(row.raw_net_amount) < 0;
  return row.payment_status === "pending" && !debtLike;
}
