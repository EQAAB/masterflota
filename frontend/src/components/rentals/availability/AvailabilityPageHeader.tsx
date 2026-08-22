import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";

export type AvailabilityViewMode = "list" | "calendar";

type AvailabilityPageHeaderProps = {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  view: AvailabilityViewMode;
  onViewChange: (v: AvailabilityViewMode) => void;
  onBlockDates: () => void;
  onQuickWeekly?: () => void;
  canManage?: boolean;
};

export function AvailabilityPageHeader({
  from,
  to,
  onFromChange,
  onToChange,
  view,
  onViewChange,
  onBlockDates,
  onQuickWeekly,
  canManage = false,
}: AvailabilityPageHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="mb-6 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            to="/rentals"
            className={`${btnSecondary} !mb-3 !inline-flex !min-h-0 !px-3 !py-1.5 !text-xs`}
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">
            {t("pages.availability.title")}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
            {t("pages.availability.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            className="fm-rental-availability__filter-select"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            aria-label="From date"
          />
          <span className="text-sm text-slate-400">–</span>
          <input
            type="date"
            className="fm-rental-availability__filter-select"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            aria-label="To date"
          />
          <div className="fm-rental-availability__view-toggle">
            <button
              type="button"
              className={`fm-rental-availability__view-btn ${view === "list" ? "fm-rental-availability__view-btn--active" : ""}`}
              onClick={() => onViewChange("list")}
            >
              List
            </button>
            <button
              type="button"
              className={`fm-rental-availability__view-btn ${view === "calendar" ? "fm-rental-availability__view-btn--active" : ""}`}
              onClick={() => onViewChange("calendar")}
            >
              Calendar
            </button>
          </div>
          {canManage ? (
            <>
              <button type="button" className={btnSecondary} onClick={onBlockDates}>
                Block dates
              </button>
              {onQuickWeekly ? (
                <button type="button" className={btnPrimary} onClick={onQuickWeekly}>
                  {t("pages.availability.quickWeekly")}
                </button>
              ) : null}
              <Link to="/rentals/bookings/new" className={`${btnSecondary} fm-rental-availability__header-cta`}>
                Advanced booking
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
