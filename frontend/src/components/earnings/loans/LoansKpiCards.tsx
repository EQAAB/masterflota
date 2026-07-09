import type { LoansSummaryResponse } from "../../../api/driverLoans";
import { formatCurrency } from "../../../utils/currency";
import { transitionDefault } from "../../../theme/classNames";

type LoansKpiCardsProps = {
  summary?: LoansSummaryResponse;
  loading?: boolean;
};

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className={`rounded-[14px] border border-border/70 bg-white p-4 shadow-soft ${transitionDefault}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function LoansKpiCards({ summary, loading }: LoansKpiCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[88px] animate-pulse rounded-[14px] bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <KpiCard
        label="Total disbursed"
        value={formatCurrency(summary.totalDisbursed)}
        sub="Cash ever given to drivers"
      />
      <KpiCard
        label="Outstanding"
        value={formatCurrency(summary.totalOutstanding)}
        sub={`${summary.driversWithActiveLoans} driver${summary.driversWithActiveLoans === 1 ? "" : "s"} with balance`}
      />
      <KpiCard
        label="Repaid (approx.)"
        value={formatCurrency(Math.max(0, summary.totalDisbursed - summary.totalOutstanding))}
        sub="Disbursed minus outstanding"
      />
    </div>
  );
}
