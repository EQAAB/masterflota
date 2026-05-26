import type { EarningsOverviewResponse, PayoutIntegrityRow } from "../../../api/earnings";

export type MonthlyItem = EarningsOverviewResponse["monthly"][number];

export type IntegrityFilters = {
  dateFrom?: string;
  dateTo?: string;
  platform?: string;
  statusFilter?: "all" | "ok" | "broken";
};

export type MonthRangePreset = "6" | "12" | "all";

function parseMonthLabel(label: string): Date | null {
  const d = new Date(`${label} 1`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function formatDateRangeLabel(from: string, to: string): string {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(iso + "T12:00:00"),
    );
  return `${fmt(from)} – ${fmt(to)}`;
}

export function sumMonthlyField(monthly: MonthlyItem[], field: "totalEarnings" | "totalCommission"): number {
  return monthly.reduce((s, m) => s + (m[field] ?? 0), 0);
}

export function estimatedCommission30d(
  kpis: EarningsOverviewResponse["kpis"],
  monthly: MonthlyItem[],
): number {
  const grossMonthly = sumMonthlyField(monthly, "totalEarnings");
  const commMonthly = sumMonthlyField(monthly, "totalCommission");
  if (grossMonthly <= 0 || monthly.length === 0) return 0;
  return (commMonthly / grossMonthly) * kpis.totalEarningsLast30Days;
}

export function pendingSharePct(kpis: EarningsOverviewResponse["kpis"]): number {
  const denom = kpis.pendingPaymentsTotal + kpis.totalEarningsLast30Days;
  if (denom <= 0) return 0;
  return Math.min(100, (kpis.pendingPaymentsTotal / denom) * 100);
}

export function commissionSharePct(commission: number, gross: number): number {
  const base = commission + gross;
  if (base <= 0) return 0;
  return (commission / base) * 100;
}

export function pendingOfGrossPct(kpis: EarningsOverviewResponse["kpis"]): number | null {
  if (kpis.totalEarningsLast30Days <= 0) return null;
  return (kpis.pendingPaymentsTotal / kpis.totalEarningsLast30Days) * 100;
}

export function filterMonthlyByRange(
  monthly: MonthlyItem[],
  dateFrom?: string,
  dateTo?: string,
): MonthlyItem[] {
  if (!dateFrom && !dateTo) return monthly;
  const fromMs = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : -Infinity;
  const toMs = dateTo ? new Date(dateTo + "T23:59:59").getTime() : Infinity;

  return monthly.filter((m) => {
    const monthStart = parseMonthLabel(m.month);
    if (!monthStart) return true;
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59);
    return monthEnd.getTime() >= fromMs && monthStart.getTime() <= toMs;
  });
}

export function sliceMonthlyByPreset(monthly: MonthlyItem[], preset: MonthRangePreset): MonthlyItem[] {
  if (preset === "all") return monthly;
  const n = preset === "6" ? 6 : 12;
  return monthly.slice(-n);
}

export function filterIntegrityRows(
  rows: PayoutIntegrityRow[],
  filters: IntegrityFilters,
): PayoutIntegrityRow[] {
  return rows.filter((r) => {
    if (filters.dateFrom && r.trip_date < filters.dateFrom) return false;
    if (filters.dateTo && r.trip_date > filters.dateTo) return false;
    if (filters.platform && filters.platform !== "all" && r.platform !== filters.platform) return false;
    if (filters.statusFilter === "ok" && !r.ok) return false;
    if (filters.statusFilter === "broken" && r.ok) return false;
    return true;
  });
}

export function uniquePlatforms(rows: PayoutIntegrityRow[]): string[] {
  const set = new Set(rows.map((r) => r.platform).filter(Boolean));
  return Array.from(set).sort();
}

export type SparklineField = "totalEarnings" | "totalCommission" | "grossDelta";

export function buildSparklineSeries(
  monthly: MonthlyItem[],
  field: SparklineField,
  maxPoints = 12,
): { value: number }[] {
  const slice = monthly.slice(-maxPoints);
  if (field === "grossDelta") {
    return slice.map((m, i) => {
      const prev = i > 0 ? slice[i - 1].totalEarnings : m.totalEarnings;
      return { value: m.totalEarnings - prev };
    });
  }
  return slice.map((m) => ({ value: m[field] ?? 0 }));
}

export function applyDatePreset(preset: "30d" | "90d" | "6mo"): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (preset === "30d") from.setDate(from.getDate() - 30);
  else if (preset === "90d") from.setDate(from.getDate() - 90);
  else from.setMonth(from.getMonth() - 6);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}
