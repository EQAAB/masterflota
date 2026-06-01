import type { RentalBooking, RentalDashboard } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { formatTrendDelta } from "../dashboard/rentalDashboardUtils";
import { countCompleted, countUpcomingPickups } from "./bookingsListUtils";

type BookingsKpiRowProps = {
  dashboard?: RentalDashboard;
  bookings: RentalBooking[];
  loading?: boolean;
};

export function BookingsKpiRow({ dashboard, bookings, loading }: BookingsKpiRowProps) {
  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="fm-rental-bookings__skeleton fm-rental-bookings__kpi min-h-[100px]" />
        ))}
      </div>
    );
  }

  const upcoming = countUpcomingPickups(bookings);
  const completed = countCompleted(bookings);
  const activeTrend = formatTrendDelta(dashboard?.trends?.active_week_delta ?? 0, "this week");
  const revenuePct = dashboard?.trends?.revenue_mom_pct;

  const cards = [
    {
      key: "active",
      label: "Active bookings",
      value: dashboard?.active_bookings ?? bookings.filter((b) => b.status === "active").length,
      trend: activeTrend.text,
      trendPositive: activeTrend.positive,
      variant: "fm-rental-bookings__kpi--active",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    {
      key: "upcoming",
      label: "Upcoming pickups",
      value: upcoming,
      trend: upcoming === 0 ? "None in next 7 days" : `${upcoming} returning soon`,
      trendPositive: upcoming > 0 ? true : undefined,
      variant: "fm-rental-bookings__kpi--upcoming",
      iconBg: "bg-amber-100 text-amber-800",
    },
    {
      key: "completed",
      label: "Completed rentals",
      value: completed,
      trend: `${completed} total completed`,
      trendPositive: undefined,
      variant: "fm-rental-bookings__kpi--completed",
      iconBg: "bg-violet-100 text-violet-800",
    },
    {
      key: "revenue",
      label: "Monthly revenue",
      value: formatCurrency(Number(dashboard?.mtd_revenue ?? 0)),
      trend:
        revenuePct == null
          ? "MTD paid rent"
          : revenuePct === 0
            ? "Same as last month"
            : `${revenuePct > 0 ? "+" : ""}${revenuePct}% vs last month`,
      trendPositive: revenuePct != null && revenuePct > 0,
      variant: "fm-rental-bookings__kpi--revenue",
      iconBg: "bg-brand-mint text-brand-dark",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.key} className={`fm-rental-bookings__kpi ${card.variant}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-ink">{card.value}</p>
              <p
                className={`mt-1 text-xs font-medium ${
                  card.trendPositive === true
                    ? "text-emerald-700"
                    : card.trendPositive === false
                      ? "text-amber-800"
                      : "text-slate-500"
                }`}
              >
                {card.trend}
              </p>
            </div>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
