import type { ReactNode } from "react";
import type { LoansSummaryResponse } from "../../api/driverLoans";
import {
  formatLoanFleetSummaryText,
  shouldShowLoanFleetSummary,
} from "./loanFleetSummaryDisplay";

type LoanFleetSummaryStripProps = {
  data: LoansSummaryResponse;
  action?: ReactNode;
};

export function LoanFleetSummaryStrip({ data, action }: LoanFleetSummaryStripProps) {
  if (!shouldShowLoanFleetSummary(data)) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200/70 bg-sky-50/50 px-3 py-2 text-sm">
      <span className="text-sky-900">{formatLoanFleetSummaryText(data)}</span>
      {action}
    </div>
  );
}
