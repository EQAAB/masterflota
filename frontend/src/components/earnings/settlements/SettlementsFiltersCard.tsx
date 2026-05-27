import { btnPrimary, btnSecondary, transitionDefault } from "../../../theme/classNames";

const filterCardClass =
  `rounded-[18px] border border-border/70 bg-white p-4 shadow-soft sm:p-5 ${transitionDefault}`;

const filterLabelClass = "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-muted";

const filterInputClass =
  "w-full h-[42px] rounded-xl border border-border/80 bg-white px-3 text-sm text-ink shadow-sm outline-none " +
  "transition-all duration-200 ease-out placeholder:text-ink-muted " +
  "hover:border-border hover:bg-slate-50/90 " +
  "focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const actionBtnClass = "h-[42px] min-h-[42px] px-4 text-sm shadow-soft hover:shadow-soft-lg";

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
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:gap-4 min-w-0">
          <div className="min-w-0 flex-1 sm:max-w-[200px]">
            <label className={filterLabelClass} htmlFor="settlements-period-start">
              Period start
            </label>
            <div className="relative">
              <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                id="settlements-period-start"
                type="date"
                className={`${filterInputClass} pl-9`}
                value={periodStart}
                onChange={(e) => onPeriodStartChange(e.target.value)}
              />
            </div>
          </div>
          <div className="min-w-0 flex-1 sm:max-w-[200px]">
            <label className={filterLabelClass} htmlFor="settlements-period-end">
              Period end
            </label>
            <div className="relative">
              <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                id="settlements-period-end"
                type="date"
                className={`${filterInputClass} pl-9`}
                value={periodEnd}
                onChange={(e) => onPeriodEndChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-stretch gap-2 sm:gap-3">
          <button
            type="button"
            disabled={refreshPending}
            onClick={onRefresh}
            className={`${btnSecondary} ${actionBtnClass} whitespace-nowrap`}
          >
            {refreshPending ? "Refreshing…" : "Refresh settlements"}
          </button>
          <button
            type="button"
            disabled={markPaidPending || pendingCount === 0}
            onClick={onMarkPaid}
            className={`${btnPrimary} ${actionBtnClass} whitespace-nowrap`}
          >
            {markPaidPending ? "Paying…" : pendingCount > 0 ? `Mark paid (${pendingCount})` : "Mark paid"}
          </button>
        </div>
      </div>
    </div>
  );
}
