import { useTranslation } from "react-i18next";
import { canAdvancePaymentWeek, shiftPaymentWeek } from "../../../utils/earningsImportWeek";
import { filterInputClass } from "./PayoutFiltersCard";
import { formatPeriodParts } from "./payoutBreakdownUtils";

export type PayoutWeekNavigatorProps = {
  weekStart: string;
  weekEnd: string;
  onWeekChange: (start: string, end: string) => void;
  disabled?: boolean;
  /** When true, show date inputs (toolbar). Default header shows label + arrows + dates. */
  showDateInputs?: boolean;
};

const navBtnClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function PayoutWeekNavigator({
  weekStart,
  weekEnd,
  onWeekChange,
  disabled = false,
  showDateInputs = true,
}: PayoutWeekNavigatorProps) {
  const { t } = useTranslation();
  const periodParts = formatPeriodParts(weekStart, weekEnd);
  const periodLabel = periodParts
    ? `${periodParts.range}, ${periodParts.year}`
    : `${weekStart} – ${weekEnd}`;

  const canGoNext = canAdvancePaymentWeek(weekStart, weekEnd);
  const canGoPrev = shiftPaymentWeek(weekStart, weekEnd, -1) != null;

  function shiftWeek(weeks: -1 | 1) {
    const shifted = shiftPaymentWeek(weekStart, weekEnd, weeks);
    if (shifted) onWeekChange(shifted.start, shifted.end);
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-slate-50/80 px-1.5 py-1">
      <button
        type="button"
        className={navBtnClass}
        aria-label={t("pages.earningsPayouts.previousWeek")}
        disabled={disabled || !canGoPrev}
        onClick={() => shiftWeek(-1)}
      >
        <ChevronLeftIcon />
      </button>

      <div className="flex min-w-0 flex-1 flex-col items-center px-1 sm:min-w-[10rem]">
        <span className="truncate text-center text-xs font-medium text-ink tabular-nums">{periodLabel}</span>
        {showDateInputs && (
          <div className="mt-0.5 flex items-center gap-1">
            <input
              type="date"
              aria-label={t("pages.earningsPayouts.weekStartLabel")}
              className={`${filterInputClass} !h-7 !min-h-0 !w-[7.5rem] !border-0 !bg-transparent !px-1 !text-[11px] !shadow-none`}
              value={weekStart}
              disabled={disabled}
              onChange={(e) => onWeekChange(e.target.value, weekEnd)}
            />
            <span className="text-[10px] text-ink-muted">–</span>
            <input
              type="date"
              aria-label={t("pages.earningsPayouts.weekEndLabel")}
              className={`${filterInputClass} !h-7 !min-h-0 !w-[7.5rem] !border-0 !bg-transparent !px-1 !text-[11px] !shadow-none`}
              value={weekEnd}
              disabled={disabled}
              onChange={(e) => onWeekChange(weekStart, e.target.value)}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        className={navBtnClass}
        aria-label={t("pages.earningsPayouts.nextWeek")}
        disabled={disabled || !canGoNext}
        onClick={() => shiftWeek(1)}
      >
        <ChevronRightIcon />
      </button>
    </div>
  );
}
