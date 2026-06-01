import type { RentalPricingSummary } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";

type PricingKpiRowProps = {
  summary?: RentalPricingSummary;
  loading?: boolean;
};

export function PricingKpiRow({ summary, loading }: PricingKpiRowProps) {
  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="fm-rental-pricing__skeleton fm-rental-pricing__kpi min-h-[100px]" />
        ))}
      </div>
    );
  }

  const trend = summary?.daily_rate_trend_pct;
  const trendText =
    trend == null
      ? "Across active rules"
      : trend === 0
        ? "Same as last month"
        : `${trend > 0 ? "+" : ""}${trend}% from last month`;

  const cards = [
    {
      key: "daily",
      label: "Average daily rate",
      value: formatCurrency(Number(summary?.avg_daily_rate ?? 0)),
      trend: trendText,
      variant: "fm-rental-pricing__kpi--daily",
      iconBg: "bg-brand-mint text-brand-dark",
    },
    {
      key: "weekly",
      label: "Average weekly rate",
      value: formatCurrency(Number(summary?.avg_weekly_rate ?? 0)),
      trend: `${summary?.pricing_rules_active ?? 0} active rules`,
      variant: "fm-rental-pricing__kpi--weekly",
      iconBg: "bg-sky-100 text-sky-800",
    },
    {
      key: "revenue",
      label: "Monthly revenue estimate",
      value: formatCurrency(Number(summary?.monthly_revenue_estimate ?? 0)),
      trend: "Sum of monthly rates (vehicle rules)",
      variant: "fm-rental-pricing__kpi--revenue",
      iconBg: "bg-violet-100 text-violet-800",
    },
    {
      key: "custom",
      label: "Vehicles with custom pricing",
      value: summary?.vehicles_with_custom_pricing ?? 0,
      trend: "Per-vehicle rate cards",
      variant: "fm-rental-pricing__kpi--custom",
      iconBg: "bg-amber-100 text-amber-800",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.key} className={`fm-rental-pricing__kpi ${card.variant}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-ink">{card.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{card.trend}</p>
            </div>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
