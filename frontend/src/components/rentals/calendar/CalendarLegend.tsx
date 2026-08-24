import { useTranslation } from "react-i18next";

const items = [
  { key: "active" as const, dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-800 ring-emerald-200/60" },
  { key: "completed" as const, dot: "bg-violet-500", pill: "bg-violet-50 text-violet-800 ring-violet-200/60" },
  { key: "upcoming" as const, dot: "bg-sky-500", pill: "bg-sky-50 text-sky-800 ring-sky-200/60" },
  { key: "pending" as const, dot: "bg-amber-500", pill: "bg-amber-50 text-amber-900 ring-amber-200/60" },
  { key: "cancelled" as const, dot: "bg-rose-500", pill: "bg-rose-50 text-rose-800 ring-rose-200/60" },
];

export function CalendarLegend() {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex flex-wrap gap-2" aria-label={t("pages.rentalCalendar.legendAriaLabel")}>
      {items.map(({ key, dot, pill }) => (
        <span key={key} className={`fm-rental-calendar__legend-pill ${pill}`}>
          <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
          {key === "upcoming" ? t("pages.rentalCalendar.legendUpcoming") : t(`rentalStatus.booking.${key}`)}
        </span>
      ))}
    </div>
  );
}
