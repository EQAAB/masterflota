import i18n from "../../i18n";
import type { LoansSummaryResponse } from "../../api/driverLoans";

export function shouldShowLoanFleetSummary(data: LoansSummaryResponse): boolean {
  return data.totalDisbursed > 0 || data.totalOutstanding > 0;
}

export function formatLoanFleetSummaryText(data: LoansSummaryResponse): string {
  const disbursed = formatRon(data.totalDisbursed);
  if (data.totalOutstanding <= 0) {
    return i18n.t("loanSummary.disbursedOnly", { amount: disbursed });
  }

  const outstanding = formatRon(data.totalOutstanding);
  return i18n.t("loanSummary.disbursedOutstanding", {
    disbursed,
    outstanding,
    count: data.driversWithActiveLoans,
  });
}

function formatRon(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
