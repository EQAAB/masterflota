import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RentalDashboardCard } from "./RentalDashboardCard";

type CalendarPreviewProps = {
  bookingDates?: string[];
  loading?: boolean;
  className?: string;
};

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function CalendarPreview({ bookingDates = [], loading, className }: CalendarPreviewProps) {
  const { t, i18n } = useTranslation();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = (firstDay.getDay() + 6) % 7;
  const dateSet = new Set(bookingDates.map((d) => (typeof d === "string" ? d.slice(0, 10) : String(d))));

  const monthLabel = today.toLocaleString(i18n.language?.startsWith("ro") ? "ro-RO" : "en-GB", { month: "long", year: "numeric" });
  const todayKey = toDateKey(today);
  const weekdayLabels = [
    t("pages.rentalDashboard.weekdayMon"),
    t("pages.rentalDashboard.weekdayTue"),
    t("pages.rentalDashboard.weekdayWed"),
    t("pages.rentalDashboard.weekdayThu"),
    t("pages.rentalDashboard.weekdayFri"),
    t("pages.rentalDashboard.weekdaySat"),
    t("pages.rentalDashboard.weekdaySun"),
  ];

  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <RentalDashboardCard title={t("pages.rentalDashboard.calendarPreviewTitle")} viewAllTo="/rentals/calendar" className={className}>
      {loading ? (
        <div className="fm-rental-dashboard__skeleton h-48" />
      ) : (
        <>
          <p className="mb-3 text-xs font-semibold text-ink-muted">{monthLabel}</p>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-slate-400">
            {weekdayLabels.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (day === null) return <span key={`e-${idx}`} className="h-8" />;
              const key = toDateKey(new Date(year, month, day));
              const hasBooking = dateSet.has(key);
              const isToday = key === todayKey;
              return (
                <span
                  key={key}
                  className={`fm-rental-dashboard__cal-day mx-auto ${
                    hasBooking ? "fm-rental-dashboard__cal-day--has-booking" : ""
                  } ${isToday ? "fm-rental-dashboard__cal-day--today" : ""}`}
                >
                  {day}
                </span>
              );
            })}
          </div>
          <Link
            to="/rentals/calendar"
            className="mt-4 block text-center text-xs font-medium text-brand hover:underline"
          >
            {t("pages.rentalDashboard.openFullCalendar")}
          </Link>
        </>
      )}
    </RentalDashboardCard>
  );
}
