import type { DebtSummaryResponse } from "../../../api/earnings";
import { btnDangerOutline, btnPrimary, transitionDefault } from "../../../theme/classNames";

type PayoutDebtSummaryProps = {
  data: DebtSummaryResponse;
  bulkDebtBusy: boolean;
  debtActionMsg: string | null;
  onBulkCarryForward: () => void;
  onViewDebtPayouts: () => void;
  onSelectDriver: (driverId: string) => void;
};

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

const tnumStyle = { fontFeatureSettings: '"tnum"' } as const;

export function PayoutDebtSummary({
  data,
  bulkDebtBusy,
  debtActionMsg,
  onBulkCarryForward,
  onViewDebtPayouts,
  onSelectDriver,
}: PayoutDebtSummaryProps) {
  const outstanding = data.totalOutstanding.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <section className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
      <div
        className={`flex min-h-[80px] items-center rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/95 to-orange-50/30 px-4 py-3 shadow-[0_2px_16px_rgba(244,63,94,0.08)] ${transitionDefault} hover:-translate-y-px`}
      >
        <div className="flex w-full items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 ring-1 ring-rose-200/60">
            <AlertIcon className="h-[17px] w-[17px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-800/90">
              Outstanding debt
            </p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-rose-950 sm:text-2xl" style={tnumStyle}>
              {outstanding} <span className="text-sm font-semibold text-rose-800">RON</span>
            </p>
            <p className="mt-0.5 text-[11px] text-rose-800/80">
              {data.driversWithDebt} driver{data.driversWithDebt === 1 ? "" : "s"} with open debt
            </p>
          </div>
        </div>
      </div>

      <div
        className={`rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-soft ${transitionDefault} hover:-translate-y-px hover:shadow-md`}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <UsersIcon className="h-4 w-4" />
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Top debtors</p>
        </div>
        {data.topDebtors.length === 0 ? (
          <p className="text-sm text-ink-muted">No outstanding debtors.</p>
        ) : (
          <ul className="space-y-1.5">
            {data.topDebtors.slice(0, 5).map((d) => (
              <li key={d.driverId} className="flex justify-between gap-2 text-sm">
                <button
                  type="button"
                  className="truncate text-left font-medium text-ink hover:text-brand hover:underline"
                  onClick={() => onSelectDriver(d.driverId)}
                >
                  {d.name}
                </button>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-ink">
                  {d.outstanding.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  RON
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col justify-center gap-2 rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-soft">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Debt actions</p>
        <button type="button" disabled={bulkDebtBusy} onClick={onBulkCarryForward} className={btnDangerOutline}>
          {bulkDebtBusy ? "Working…" : "Bulk carry-forward (filtered period)"}
        </button>
        <button
          type="button"
          className={`${btnPrimary} bg-danger hover:opacity-95`}
          onClick={onViewDebtPayouts}
        >
          View debt payouts
        </button>
        {debtActionMsg && (
          <p className="border-t border-border/60 pt-2 text-[11px] text-ink-muted">{debtActionMsg}</p>
        )}
      </div>
    </section>
  );
}
