import type { LoansSummaryResponse } from "../../api/driverLoans";

export function shouldShowLoanFleetSummary(data: LoansSummaryResponse): boolean {
  return data.totalDisbursed > 0 || data.totalOutstanding > 0;
}

export function formatLoanFleetSummaryText(data: LoansSummaryResponse): string {
  const disbursed = formatRon(data.totalDisbursed);
  if (data.totalOutstanding <= 0) {
    return `${disbursed} RON disbursed`;
  }

  const outstanding = formatRon(data.totalOutstanding);
  const driverLabel = data.driversWithActiveLoans === 1 ? "driver" : "drivers";
  return `${disbursed} RON disbursed · ${outstanding} RON outstanding across ${data.driversWithActiveLoans} ${driverLabel}`;
}

function formatRon(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
