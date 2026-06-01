import type { RentalPaymentsSummary } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";

type PaymentsKpiRowProps = {
  summary?: RentalPaymentsSummary;
  loading?: boolean;
};

export function PaymentsKpiRow({ summary, loading }: PaymentsKpiRowProps) {
  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="fm-rental-payments__skeleton fm-rental-payments__kpi min-h-[100px]" />
        ))}
      </div>
    );
  }

  const trend = summary?.revenue_trend_pct;
  const mtdTrend =
    trend == null
      ? "Paid rent this month"
      : trend === 0
        ? "Same as last month"
        : `${trend > 0 ? "+" : ""}${trend}% this month`;

  const cards = [
    {
      key: "total",
      label: "Total revenue",
      value: formatCurrency(Number(summary?.total_revenue ?? 0)),
      trend: "All paid transactions",
      variant: "fm-rental-payments__kpi--total",
      iconBg: "bg-brand-mint text-brand-dark",
    },
    {
      key: "paid",
      label: "Paid payments",
      value: summary?.paid_count ?? 0,
      trend: "Completed successfully",
      variant: "fm-rental-payments__kpi--paid",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    {
      key: "pending",
      label: "Pending payments",
      value: summary?.pending_count ?? 0,
      trend: "Awaiting collection",
      variant: "fm-rental-payments__kpi--pending",
      iconBg: "bg-amber-100 text-amber-800",
    },
    {
      key: "mtd",
      label: "This month revenue",
      value: formatCurrency(Number(summary?.mtd_revenue ?? 0)),
      trend: mtdTrend,
      variant: "fm-rental-payments__kpi--mtd",
      iconBg: "bg-sky-100 text-sky-800",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.key} className={`fm-rental-payments__kpi ${card.variant}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-ink">{card.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{card.trend}</p>
            </div>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
