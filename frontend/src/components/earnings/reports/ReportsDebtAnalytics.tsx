import { formatCurrency } from "../../../utils/currency";
import { card } from "../../../theme/classNames";
import {
  DEBT_AGING_BUCKETS,
  debtBucketLabel,
  debtBucketTint,
  type DebtAgingBucketKey,
} from "./reportsDisplayUtils";

type DebtsAgingData = {
  buckets: Record<string, { total: number; rowCount: number }>;
};

type DebtHistoryData = {
  adjustments: {
    id: string;
    payout_id: string;
    amount: string;
    reason: string | null;
    adjustment_type: string;
    created_at: string;
    period_start: string | null;
    period_end: string | null;
  }[];
  payouts: {
    id: string;
    payment_period_start: string | null;
    payment_period_end: string | null;
    remaining_debt_amount: string | null;
    payment_status: string;
  }[];
};

type ReportsDebtAnalyticsProps = {
  aging: DebtsAgingData | undefined;
  agingLoading: boolean;
  driverIdFromUrl?: string;
  debtHistory: DebtHistoryData | undefined;
  showDebtHistory: boolean;
};

function CalendarBadgeIcon({ className }: { className?: string }) {
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

function AgingMiniCard({
  bucketKey,
  total,
  rowCount,
}: {
  bucketKey: DebtAgingBucketKey;
  total: number;
  rowCount: number;
}) {
  const tint = debtBucketTint(bucketKey);
  return (
    <div className={`rounded-[14px] border p-3 ${tint.card}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium text-ink-muted">{debtBucketLabel(bucketKey)}</p>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tint.icon}`}>
          <CalendarBadgeIcon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-2 text-base font-semibold tabular-nums text-ink">{formatCurrency(total)}</p>
      <p className="mt-0.5 text-[11px] text-ink-muted">
        {rowCount.toLocaleString()} row{rowCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export function ReportsDebtAnalytics({
  aging,
  agingLoading,
  driverIdFromUrl,
  debtHistory,
  showDebtHistory,
}: ReportsDebtAnalyticsProps) {
  return (
    <div className={`${card} !p-4`}>
      <h2 className="text-sm font-semibold text-ink">Debt analytics</h2>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {agingLoading && <p className="col-span-full text-xs text-ink-muted">Loading aging…</p>}
        {!agingLoading &&
          aging &&
          DEBT_AGING_BUCKETS.map((k) => (
            <AgingMiniCard
              key={k}
              bucketKey={k}
              total={aging.buckets[k]?.total ?? 0}
              rowCount={aging.buckets[k]?.rowCount ?? 0}
            />
          ))}
      </div>

      {showDebtHistory && driverIdFromUrl && debtHistory && (
        <div className="mt-4 border-t border-border/60 pt-4">
          <h3 className="text-xs font-semibold text-ink mb-2">Driver debt history</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted mb-1.5">
                Adjustments
              </p>
              <ul className="max-h-40 overflow-auto rounded-xl border border-border bg-white text-[11px] divide-y divide-border">
                {debtHistory.adjustments.length === 0 ? (
                  <li className="px-3 py-2 text-ink-muted">No adjustments yet.</li>
                ) : (
                  debtHistory.adjustments.map((a) => (
                    <li key={a.id} className="px-3 py-1.5 space-y-0.5">
                      <span className="font-medium text-ink">{a.adjustment_type}</span>{" "}
                      <span className="tabular-nums">{a.amount}</span>
                      <div className="text-ink-muted">
                        {a.period_start?.slice(0, 10)} – {a.period_end?.slice(0, 10)} ·{" "}
                        {a.created_at?.slice(0, 19)}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted mb-1.5">
                Payout periods
              </p>
              <ul className="max-h-40 overflow-auto rounded-xl border border-border bg-white text-[11px] divide-y divide-border">
                {debtHistory.payouts.map((p) => (
                  <li key={p.id} className="px-3 py-1.5 flex justify-between gap-2">
                    <span className="text-ink-muted">
                      {p.payment_period_start?.slice(0, 10)} – {p.payment_period_end?.slice(0, 10)}
                    </span>
                    <span className="shrink-0 text-ink">
                      rem {p.remaining_debt_amount} · {p.payment_status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
