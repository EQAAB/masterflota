import type { EarningsOverviewResponse, PayoutIntegrityRow } from "../api/earnings";
import { formatCurrency } from "./currency";
import { earningsPlatformLabel } from "./earningsPlatformLabel";

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function toNum(v: string | null): number {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

type ExportArgs = {
  kpis: EarningsOverviewResponse["kpis"];
  integrityRows: PayoutIntegrityRow[];
  dateFrom: string;
  dateTo: string;
};

export function exportEarningsOverviewCsv({ kpis, integrityRows, dateFrom, dateTo }: ExportArgs): void {
  const kpiSection = [
    ["Earnings Overview Export"],
    ["Date range", `${dateFrom} to ${dateTo}`],
    [],
    ["KPI", "Value"],
    ["Pending payouts", formatCurrency(kpis.pendingPaymentsTotal)],
    ["Gross (30 days)", formatCurrency(kpis.totalEarningsLast30Days)],
    ["Avg paid payout (90d)", formatCurrency(kpis.avgPayoutPaidLast90Days)],
    [],
    ["Driver payout integrity"],
    [
      "Status",
      "Date",
      "Platform",
      "TVT",
      "Acct. fee",
      "Comm. base",
      "Commission",
      "Vehicle rental",
      "Driver payout",
      "Expected",
      "Delta",
    ],
  ];

  const dataRows = integrityRows.map((r) => {
    const payout = toNum(r.driver_payout);
    const expected = toNum(r.expected_payout);
    return [
      r.ok ? "OK" : "BROKEN",
      r.trip_date,
      earningsPlatformLabel(r.platform),
      r.total_transfer_earnings != null ? formatCurrency(toNum(r.total_transfer_earnings)) : "",
      r.account_opening_fee != null && toNum(r.account_opening_fee) > 0
        ? formatCurrency(toNum(r.account_opening_fee))
        : "",
      r.commission_base != null && r.commission_base !== ""
        ? formatCurrency(toNum(r.commission_base))
        : "",
      formatCurrency(toNum(r.company_commission)),
      r.vehicle_rental_fee != null && toNum(r.vehicle_rental_fee) !== 0
        ? formatCurrency(toNum(r.vehicle_rental_fee))
        : "",
      formatCurrency(payout),
      formatCurrency(expected),
      formatCurrency(payout - expected),
    ];
  });

  const csv = [...kpiSection, ...dataRows]
    .map((row) => row.map((c) => escapeCsv(String(c))).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `earnings-overview-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
