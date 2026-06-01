import { btnSecondary } from "../../../theme/classNames";
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
    return `${start.toLocaleDateString("en-GB", o)} – ${end.toLocaleDateString("en-GB", { ...o, year: "numeric" })}`;
  }
  return cursor.toLocaleString("en-GB", { month: "long", year: "numeric" });
}

export function CalendarNav({ cursorDate, view, onPrev, onNext, onToday, onViewChange }: CalendarNavProps) {
  return (
    <div className="fm-rental-calendar__nav mb-4">
      <div className="flex items-center gap-2">
        <button type="button" className="fm-rental-calendar__nav-btn" onClick={onPrev} aria-label="Previous">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="min-w-[180px] text-center text-lg font-bold text-ink">{navTitle(cursorDate, view)}</h2>
        <button type="button" className="fm-rental-calendar__nav-btn" onClick={onNext} aria-label="Next">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btnSecondary} onClick={onToday}>
          Today
        </button>
        <div className="fm-rental-calendar__view-toggle lg:hidden" role="group">
          {(["month", "week", "list"] as CalendarViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              className={`fm-rental-calendar__view-btn capitalize ${view === v ? "fm-rental-calendar__view-btn--active" : ""}`}
              onClick={() => onViewChange(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
