import type { ConsolidatedDriverPayout } from "../../../api/earnings";
import type { WeekLoanRepayment } from "../../../api/driverLoans";
import { formatCurrency } from "../../../utils/currency";
import type { FeeLadderStepDef } from "./payoutFeeBreakdown";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toNum(value: string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function formatListOutstandingLoanLine(balance: number): string {
  if (balance <= 0.02) return "";
  return `Loan: ${formatCurrency(balance)} outstanding`;
}

export function formatPlannedLoanRepaymentHint(
  row: ConsolidatedDriverPayout,
  weekStart: string,
): string | null {
  const balance = toNum(row.outstanding_loan_balance);
  if (balance <= 0.02) return null;
  const planned = row.planned_repayment_week?.slice(0, 10);
  if (!planned) return null;
  if (planned !== weekStart.slice(0, 10)) return null;
  const note = row.planned_repayment_note?.trim();
  return note ? `Planned repayment: ${note}` : "Planned repayment this week";
}

export function shouldShowListLoanContext(row: ConsolidatedDriverPayout): boolean {
  return toNum(row.outstanding_loan_balance) > 0.02;
}

export function buildLoanRepaymentLadderSteps(
  repayments: WeekLoanRepayment[],
  options: { isLoading?: boolean } = {},
): FeeLadderStepDef[] {
  if (options.isLoading) {
    return [{ kind: "loading", label: "Loading loan repayments…", amount: 0 }];
  }
  return repayments.map((r) => ({
    kind: "deduction" as const,
    prefix: "-" as const,
    label: r.loan_reference ? `Loan repayment (${r.loan_reference})` : "Loan repayment",
    amount: round2(toNum(r.amount)),
    hint: r.notes?.trim() || undefined,
  }));
}

export function buildLoanRepaymentCardLines(repayments: WeekLoanRepayment[]): string[] {
  return repayments.map((r) => {
    const ref = r.loan_reference ? ` · ${r.loan_reference}` : "";
    const note = r.notes?.trim() ? ` — ${r.notes.trim()}` : "";
    return `−${formatCurrency(toNum(r.amount))}${ref}${note}`;
  });
}
