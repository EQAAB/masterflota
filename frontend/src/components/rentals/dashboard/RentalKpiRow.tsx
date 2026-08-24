import { useTranslation } from "react-i18next";
import type { RentalDashboard } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { formatTrendDelta } from "./rentalDashboardUtils";

type RentalKpiRowProps = {
  data?: RentalDashboard;
  loading?: boolean;
};

function KpiIcon({ children, className }: { children: React.ReactNode; className: string }) {
  return <div className={`fm-rental-dashboard__kpi-icon ${className}`}>{children}</div>;
}

function KpiSkeleton() {
  return <div className="fm-rental-dashboard__skeleton fm-rental-dashboard__kpi min-h-[108px]" />;
}

export function RentalKpiRow({ data, loading }: RentalKpiRowProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  const trends = data?.trends;
  const thisWeek = t("pages.rentalDashboard.thisWeek");
  const thisMonth = t("pages.rentalDashboard.thisMonth");
  const activeTrend = formatTrendDelta(trends?.active_week_delta ?? 0, thisWeek);
  const confirmedTrend = formatTrendDelta(trends?.confirmed_week_delta ?? 0, thisWeek);
  const customerTrend = formatTrendDelta(trends?.customers_month_delta ?? 0, thisMonth);
  const revenuePct = trends?.revenue_mom_pct;
  const revenueTrendText =
    revenuePct == null
      ? t("pages.rentalDashboard.noPriorMonth")
      : revenuePct === 0
        ? t("pages.rentalDashboard.sameAsLastMonth")
        : t("pages.rentalDashboard.vsLastMonth", { sign: revenuePct > 0 ? "+" : "", pct: revenuePct });

  const cards = [
    {
      key: "active",
      label: t("pages.rentalDashboard.kpiActiveRentals"),
      value: data?.active_bookings ?? 0,
      trend: activeTrend,
      variant: "fm-rental-dashboard__kpi--active",
      iconBg: "bg-emerald-100 text-emerald-700",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: "confirmed",
      label: t("pages.rentalDashboard.kpiConfirmedUpcoming"),
      value: data?.confirmed_bookings ?? 0,
      trend:
        (data?.confirmed_bookings ?? 0) === 0
          ? { text: t("pages.rentalDashboard.noUpcomingBookings"), positive: undefined as boolean | undefined }
          : confirmedTrend,
      variant: "fm-rental-dashboard__kpi--upcoming",
      iconBg: "bg-amber-100 text-amber-800",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: "customers",
      label: t("pages.rentalDashboard.kpiCustomers"),
      value: data?.active_customers ?? 0,
      trend: customerTrend,
      variant: "fm-rental-dashboard__kpi--customers",
      iconBg: "bg-teal-100 text-teal-800",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      key: "revenue",
      label: t("pages.rentalDashboard.kpiRevenueMtd"),
      value: data ? formatCurrency(Number(data.mtd_revenue)) : t("common.emDash"),
      trend: { text: revenueTrendText, positive: revenuePct != null && revenuePct > 0 },
      variant: "fm-rental-dashboard__kpi--revenue",
      iconBg: "bg-brand-mint text-brand-dark",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.key} className={`fm-rental-dashboard__kpi ${card.variant}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-ink sm:text-[1.65rem]">
                {card.value}
              </p>
              <p
                className={`mt-1 text-xs font-medium ${
                  card.trend.positive === true
                    ? "text-emerald-700"
                    : card.trend.positive === false
                      ? "text-amber-800"
                      : "text-slate-500"
                }`}
              >
                {card.trend.text}
              </p>
            </div>
            <KpiIcon className={card.iconBg}>{card.icon}</KpiIcon>
          </div>
        </article>
      ))}
    </div>
  );
}
