import Papa from "papaparse";
import type { SubcontractorSettlementRow } from "../api/earnings";
import {
  getSubcontractorSettlementDetail,
  type SubcontractorSettlementDetail,
} from "../api/subcontractorPayouts";
import { asSettlementNumber, settlementPayable } from "../components/earnings/settlements/settlementsDisplayUtils";

function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportDetailCsv(detail: SubcontractorSettlementDetail): void {
  const { settlement, drivers } = detail;
  const csv = Papa.unparse(
    drivers.map((d) => ({
      driver: d.name,
      gross_incl_tips: d.gross,
      tips: d.tips,
      commission: d.commission,
      vehicle_rent: d.vehicle_rent,
      account_opening_fee: d.account_opening_fee,
      platform_fees: d.platform_fees,
      daily_cash: d.daily_cash,
      custom_deductions: d.custom_deductions,
      custom_additions: d.custom_additions,
      net: d.net,
    })),
  );
  downloadCsv(
    csv,
    `settlement-${settlement.subcontractor_name.replace(/\s+/g, "-")}-${settlement.period_start}.csv`,
  );
}

function exportSummaryCsv(
  row: SubcontractorSettlementRow,
  periodStart: string,
  periodEnd: string,
): void {
  const csv = Papa.unparse([
    {
      subcontractor: row.legal_name,
      period_start: periodStart,
      period_end: periodEnd,
      drivers: row.driver_payout_count ?? 0,
      gross_incl_tips: asSettlementNumber(row.total_gross_income),
      tips: asSettlementNumber(row.total_tips),
      commission: asSettlementNumber(row.total_commission),
      vehicle_rent: asSettlementNumber(row.total_vehicle_rent),
      account_opening_fee: asSettlementNumber(row.total_account_opening_fee),
      platform_fees: asSettlementNumber(row.total_platform_fees),
      daily_cash: asSettlementNumber(row.total_daily_cash),
      custom_deductions: asSettlementNumber(row.total_custom_deductions),
      custom_additions: asSettlementNumber(row.total_custom_additions),
      payable: settlementPayable(row),
      payment_status: row.payment_status ?? "pending",
    },
  ]);
  downloadCsv(
    csv,
    `settlement-${row.legal_name.replace(/\s+/g, "-")}-${periodStart}.csv`,
  );
}

export async function exportSettlementCsv(
  row: SubcontractorSettlementRow,
  periodStart: string,
  periodEnd: string,
): Promise<void> {
  if (row.id) {
    const { data } = await getSubcontractorSettlementDetail(row.id);
    exportDetailCsv(data);
    return;
  }
  exportSummaryCsv(row, periodStart, periodEnd);
}
