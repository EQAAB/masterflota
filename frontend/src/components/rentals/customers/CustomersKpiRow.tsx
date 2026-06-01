import type { RentalCustomersSummary } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";

type CustomersKpiRowProps = {
  summary?: RentalCustomersSummary;
  loading?: boolean;
};

export function CustomersKpiRow({ summary, loading }: CustomersKpiRowProps) {
  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="fm-rental-customers__skeleton fm-rental-customers__kpi min-h-[100px]" />
        ))}
      </div>
    );
  }

  const added = summary?.customers_added_this_month ?? 0;

  const cards = [
    {
      key: "total",
      label: "Total customers",
      value: summary?.total_customers ?? 0,
      trend: added === 0 ? "No new this month" : `+${added} added this month`,
      trendPositive: added > 0,
      variant: "fm-rental-customers__kpi--total",
      iconBg: "bg-sky-100 text-sky-800",
    },
    {
      key: "active",
      label: "Active rentals",
      value: summary?.active_rentals ?? 0,
      trend: "Org-wide active bookings",
      trendPositive: undefined,
      variant: "fm-rental-customers__kpi--active",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    {
      key: "returning",
      label: "Returning customers",
      value: summary?.returning_customers ?? 0,
      trend: "2+ completed rentals",
      trendPositive: undefined,
      variant: "fm-rental-customers__kpi--returning",
      iconBg: "bg-violet-100 text-violet-800",
    },
    {
      key: "revenue",
      label: "Lifetime revenue",
      value: formatCurrency(Number(summary?.lifetime_revenue ?? 0)),
      trend: "Paid rent (all time)",
      trendPositive: undefined,
      variant: "fm-rental-customers__kpi--revenue",
      iconBg: "bg-brand-mint text-brand-dark",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.key} className={`fm-rental-customers__kpi ${card.variant}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-ink">{card.value}</p>
              <p
                className={`mt-1 text-xs font-medium ${
                  card.trendPositive === true ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                {card.trend}
              </p>
            </div>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
