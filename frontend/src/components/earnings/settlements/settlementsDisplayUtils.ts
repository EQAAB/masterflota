import type { SubcontractorSettlementRow } from "../../../api/earnings";
import i18n from "../../../i18n";

export function asSettlementNumber(v: string | null | undefined): number {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function settlementRowKey(row: SubcontractorSettlementRow): string {
  return row.id ?? row.subcontractor_id;
}

export function settlementPayable(row: SubcontractorSettlementRow): number {
  return asSettlementNumber(row.total_payable ?? row.amount_payable);
}

export function canMarkSettlementPaid(row: SubcontractorSettlementRow): boolean {
  return !!row.id && row.payment_status !== "paid";
}

export function settlementStatusDisplay(row: SubcontractorSettlementRow): {
  label: string;
  className: string;
  dotClassName: string;
} {
  const status = (row.payment_status ?? "pending").toLowerCase();

  if (status === "paid") {
    return {
      label: i18n.t("status.paid"),
      className: "bg-emerald-100 text-emerald-800",
      dotClassName: "bg-emerald-500",
    };
  }
  if (status === "pending" || !row.id) {
    return {
      label: i18n.t("status.pending"),
      className: "bg-amber-100 text-amber-900",
      dotClassName: "bg-amber-500",
    };
  }
  return {
    label: i18n.t("status.debt"),
    className: "bg-red-100 text-red-800",
    dotClassName: "bg-red-500",
  };
}

export type SettlementKpiSummary = {
  subcontractorCount: number;
  grossInclTips: number;
  netDriverPayouts: number;
  totalFees: number;
  totalCommission: number;
  payable: number;
};

export function aggregateSettlementKpis(rows: SubcontractorSettlementRow[]): SettlementKpiSummary {
  let grossInclTips = 0;
  let netDriverPayouts = 0;
  let totalFees = 0;
  let totalCommission = 0;

  for (const row of rows) {
    grossInclTips += asSettlementNumber(row.total_gross_income);
    netDriverPayouts += settlementPayable(row);
    totalCommission += asSettlementNumber(row.total_commission);
    totalFees +=
      asSettlementNumber(row.total_vehicle_rent) +
      asSettlementNumber(row.total_account_opening_fee) +
      asSettlementNumber(row.total_platform_fees) +
      asSettlementNumber(row.total_daily_cash) +
      asSettlementNumber(row.total_custom_deductions) -
      asSettlementNumber(row.total_custom_additions);
  }

  return {
    subcontractorCount: rows.length,
    grossInclTips,
    netDriverPayouts,
    totalFees,
    totalCommission,
    payable: netDriverPayouts,
  };
}

export function hasSettlementData(rows: SubcontractorSettlementRow[]): boolean {
  if (rows.length === 0) return false;
  return rows.some((r) => (r.driver_payout_count ?? 0) > 0);
}

export function weekBoundsMonday(d: Date): { start: string; end: string } {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() - diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  return { start: iso(mon), end: iso(sun) };
}
