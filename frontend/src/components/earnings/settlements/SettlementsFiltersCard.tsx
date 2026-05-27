import { btnPrimary, btnSecondary, transitionDefault } from "../../../theme/classNames";

const filterCardClass =
  `rounded-[16px] border border-border/70 bg-white p-4 shadow-soft ${transitionDefault}`;

const filterLabelClass = "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500";

const controlHeight = "h-11 min-h-[44px]";

const filterInputClass =
  `w-full ${controlHeight} rounded-xl border border-border/80 bg-white px-3 pl-9 text-sm text-slate-800 shadow-sm outline-none ` +
  "transition-all duration-200 ease-out placeholder:text-slate-400 " +
  "hover:border-slate-300 hover:bg-slate-50/80 " +
  "focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const refreshBtnClass =
  `${btnSecondary} ${controlHeight} !min-h-[44px] rounded-xl px-4 text-sm font-medium shadow-sm hover:shadow-md`;

const markPaidBtnClass =
  `${btnPrimary} ${controlHeight} !min-h-[44px] rounded-xl px-4 text-sm font-medium shadow-sm hover:shadow-md`;

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z"
      />
    </svg>
  );
}

type SettlementsFiltersCardProps = {
  periodStart: string;
  periodEnd: string;
  onPeriodStartChange: (v: string) => void;
  onPeriodEndChange: (v: string) => void;
  onRefresh: () => void;
  onMarkPaid: () => void;
  refreshPending: boolean;
  markPaidPending: boolean;
  pendingCount: number;
};

export function SettlementsFiltersCard({
  periodStart,
  periodEnd,
  onPeriodStartChange,
  onPeriodEndChange,
  onRefresh,
  onMarkPaid,
  refreshPending,
  markPaidPending,
  pendingCount,
}: SettlementsFiltersCardProps) {
  return (
    <div className={filterCardClass}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:w-[188px]">
            <label className={filterLabelClass} htmlFor="settlements-period-start">
              Period start
            </label>
            <div className="relative">
              <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="settlements-period-start"
                type="date"
                className={filterInputClass}
                value={periodStart}
                onChange={(e) => onPeriodStartChange(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full sm:w-[188px]">
            <label className={filterLabelClass} htmlFor="settlements-period-end">
              Period end
            </label>
            <div className="relative">
              <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="settlements-period-end"
                type="date"
                className={filterInputClass}
                value={periodEnd}
                onChange={(e) => onPeriodEndChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:ml-auto">
          <button type="button" disabled={refreshPending} onClick={onRefresh} className={refreshBtnClass}>
            {refreshPending ? "Refreshing…" : "Refresh settlements"}
          </button>
          <button
            type="button"
            disabled={markPaidPending || pendingCount === 0}
            onClick={onMarkPaid}
            className={markPaidBtnClass}
          >
            {markPaidPending ? "Paying…" : pendingCount > 0 ? `Mark paid (${pendingCount})` : "Mark paid"}
          </button>
        </div>
      </div>
    </div>
  );
}
