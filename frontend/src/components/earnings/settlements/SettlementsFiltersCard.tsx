import { btnPrimary, btnSecondary, transitionDefault } from "../../../theme/classNames";
import type { PaymentWeekValidation } from "../../../utils/earningsImportWeek";
import type { Subcontractor } from "../../../api/subcontractors";

const filterCardClass =
  `rounded-[16px] border border-border/70 bg-white p-4 shadow-soft ${transitionDefault}`;

const filterLabelClass = "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500";

const controlHeight = "h-11 min-h-[44px]";

const filterInputClass =
  `w-full ${controlHeight} rounded-xl border border-border/80 bg-white px-3 pl-9 text-sm text-slate-800 shadow-sm outline-none ` +
  "transition-all duration-200 ease-out placeholder:text-slate-400 " +
  "hover:border-slate-300 hover:bg-slate-50/80 " +
  "focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const filterSelectClass =
  `w-full ${controlHeight} rounded-xl border border-border/80 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none ` +
  "hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20";

const secondaryBtnClass =
  `${btnSecondary} ${controlHeight} !min-h-[44px] rounded-xl px-4 text-sm font-medium shadow-sm hover:shadow-md`;

const primaryBtnClass =
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
  onResetPreviousWeek: () => void;
  periodValidation: PaymentWeekValidation;
  subcontractorId: string;
  onSubcontractorIdChange: (v: string) => void;
  subcontractors: Subcontractor[];
  subcontractorsLoading: boolean;
  onGenerateReport: () => void;
  onRefresh: () => void;
  onMarkPaid: () => void;
  generatePending: boolean;
  refreshPending: boolean;
  markPaidPending: boolean;
  pendingCount: number;
};

export function SettlementsFiltersCard({
  periodStart,
  periodEnd,
  onPeriodStartChange,
  onPeriodEndChange,
  onResetPreviousWeek,
  periodValidation,
  subcontractorId,
  onSubcontractorIdChange,
  subcontractors,
  subcontractorsLoading,
  onGenerateReport,
  onRefresh,
  onMarkPaid,
  generatePending,
  refreshPending,
  markPaidPending,
  pendingCount,
}: SettlementsFiltersCardProps) {
  const reportDisabled = generatePending || !periodValidation.valid;

  return (
    <div className={filterCardClass}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
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
                aria-invalid={periodValidation.errors.length > 0}
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
                aria-invalid={periodValidation.errors.length > 0}
              />
            </div>
          </div>
          <div className="w-full sm:w-[220px]">
            <label className={filterLabelClass} htmlFor="settlements-subcontractor">
              Subcontractor
            </label>
            <select
              id="settlements-subcontractor"
              className={filterSelectClass}
              value={subcontractorId}
              disabled={subcontractorsLoading}
              onChange={(e) => onSubcontractorIdChange(e.target.value)}
            >
              <option value="all">All subcontractors</option>
              {subcontractors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.legal_name}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={onResetPreviousWeek} className={secondaryBtnClass}>
            Previous Week
          </button>
        </div>

        {periodValidation.errors.length > 0 && (
          <ul className="list-inside list-disc space-y-0.5 text-xs text-danger" role="alert">
            {periodValidation.errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        )}
        {periodValidation.warnings.length > 0 && (
          <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-800">
            {periodValidation.warnings.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        )}

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border/50 pt-3">
          <button
            type="button"
            disabled={reportDisabled}
            onClick={onGenerateReport}
            className={primaryBtnClass}
          >
            {generatePending ? "Loading report…" : "Generate Report"}
          </button>
          <button type="button" disabled={refreshPending} onClick={onRefresh} className={secondaryBtnClass}>
            {refreshPending ? "Refreshing…" : "Refresh settlement data"}
          </button>
          <button
            type="button"
            disabled={markPaidPending || pendingCount === 0}
            onClick={onMarkPaid}
            className={secondaryBtnClass}
          >
            {markPaidPending ? "Paying…" : pendingCount > 0 ? `Mark paid (${pendingCount})` : "Mark paid"}
          </button>
        </div>
      </div>
    </div>
  );
}
