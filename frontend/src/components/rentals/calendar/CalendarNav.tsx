import { useTranslation } from "react-i18next";
import { btnSecondary } from "../../../theme/classNames";
import i18n from "../../../i18n";
import type { CalendarViewMode } from "./calendarUtils";

type CalendarNavProps = {
  cursorDate: Date;
  view: CalendarViewMode;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (v: CalendarViewMode) => void;
};

function navTitle(cursor: Date, view: CalendarViewMode): string {
  if (view === "week") {
    const start = new Date(cursor);
    const dow = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - dow);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    const locale = i18n.language?.startsWith("ro") ? "ro-RO" : "en-GB";
    return `${start.toLocaleDateString(locale, o)} – ${end.toLocaleDateString(locale, { ...o, year: "numeric" })}`;
  }
  const locale = i18n.language?.startsWith("ro") ? "ro-RO" : "en-GB";
  return cursor.toLocaleString(locale, { month: "long", year: "numeric" });
}

export function CalendarNav({ cursorDate, view, onPrev, onNext, onToday, onViewChange }: CalendarNavProps) {
  const { t } = useTranslation();
  return (
    <div className="fm-rental-calendar__nav mb-4">
      <div className="flex items-center gap-2">
        <button type="button" className="fm-rental-calendar__nav-btn" onClick={onPrev} aria-label={t("pages.rentalCalendar.previous")}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="min-w-[180px] text-center text-lg font-bold text-ink">{navTitle(cursorDate, view)}</h2>
        <button type="button" className="fm-rental-calendar__nav-btn" onClick={onNext} aria-label={t("pages.rentalCalendar.next")}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btnSecondary} onClick={onToday}>
          {t("pages.rentalCalendar.today")}
        </button>
        <div className="fm-rental-calendar__view-toggle lg:hidden" role="group">
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
      </div>
    </div>
  );
}
