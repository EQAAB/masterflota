import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCanManageRentals } from "../../../lib/rentalsPermissions";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";
import type { CalendarViewMode } from "./calendarUtils";

type CalendarPageHeaderProps = {
  view: CalendarViewMode;
  onViewChange: (v: CalendarViewMode) => void;
};

export function CalendarPageHeader({ view, onViewChange }: CalendarPageHeaderProps) {
  const { t } = useTranslation();
  const canManage = useCanManageRentals();
  return (
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <Link
          to="/rentals"
          className={`${btnSecondary} !mb-3 !inline-flex !min-h-0 !px-3 !py-1.5 !text-xs`}
        >
          ← {t("common.back")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">
          {t("pages.rentalCalendar.title")}
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">{t("pages.rentalCalendar.subtitle")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="fm-rental-calendar__view-toggle" role="group" aria-label={t("pages.rentalCalendar.calendarViewAriaLabel")}>
          {(["month", "week", "list"] as CalendarViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              className={`fm-rental-calendar__view-btn capitalize ${view === v ? "fm-rental-calendar__view-btn--active" : ""}`}
              onClick={() => onViewChange(v)}
            >
              {t(`pages.rentalCalendar.view${v.charAt(0).toUpperCase()}${v.slice(1)}`)}
            </button>
          ))}
        </div>
        {canManage && (
          <Link to="/rentals/bookings/new" className={`${btnPrimary} fm-rental-bookings__header-cta shrink-0`}>
            {t("pages.bookings.add")}
          </Link>
        )}
      </div>
    </header>
  );
}
