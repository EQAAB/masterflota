import { useTranslation } from "react-i18next";
import type { RentalAvailabilitySummary } from "../../../api/rentals";

type AvailabilityKpiRowProps = {
  summary?: RentalAvailabilitySummary;
  loading?: boolean;
};

export function AvailabilityKpiRow({ summary, loading }: AvailabilityKpiRowProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="fm-rental-availability__skeleton fm-rental-availability__kpi min-h-[100px]" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      key: "available",
      label: t("pages.availability.kpiAvailableVehicles"),
      value: summary?.available_vehicles ?? 0,
      trend: t("pages.availability.kpiAvailableVehiclesTrend"),
      variant: "fm-rental-availability__kpi--available",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    {
      key: "rented",
      label: t("pages.availability.kpiCurrentlyRented"),
      value: summary?.currently_rented ?? 0,
      trend: t("pages.availability.kpiCurrentlyRentedTrend"),
      variant: "fm-rental-availability__kpi--rented",
      iconBg: "bg-sky-100 text-sky-800",
    },
    {
      key: "upcoming",
      label: t("pages.availability.kpiUpcomingBookings"),
      value: summary?.upcoming_bookings ?? 0,
      trend: t("pages.availability.kpiUpcomingBookingsTrend"),
      variant: "fm-rental-availability__kpi--upcoming",
      iconBg: "bg-amber-100 text-amber-800",
    },
    {
      key: "blocked",
      label: t("pages.availability.kpiBlockedDays"),
      value: summary?.blocked_days ?? 0,
      trend: t("pages.availability.kpiBlockedDaysTrend"),
      variant: "fm-rental-availability__kpi--blocked",
      iconBg: "bg-rose-100 text-rose-800",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.key} className={`fm-rental-availability__kpi ${card.variant}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-ink">{card.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{card.trend}</p>
            </div>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
