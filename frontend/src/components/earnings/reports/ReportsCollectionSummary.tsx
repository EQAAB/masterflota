import { formatCurrency } from "../../../utils/currency";
import { card } from "../../../theme/classNames";

type DebtsCollectionData = {
  from: string;
  to: string;
  appliedFromPayouts: { periodEnd: string; collected: number }[];
  adjustmentsByType: Record<string, number>;
};

type ReportsCollectionSummaryProps = {
  collectionFrom: string;
  collectionTo: string;
  collection: DebtsCollectionData | undefined;
  collectionLoading: boolean;
};

export function ReportsCollectionSummary({
  collectionFrom,
  collectionTo,
  collection,
  collectionLoading,
}: ReportsCollectionSummaryProps) {
  return (
    <div className={`${card} !p-4`}>
      <h3 className="text-sm font-semibold text-ink">Collection summary (uses period filters)</h3>
      {!collectionFrom || !collectionTo ? (
        <p className="mt-1.5 text-xs text-ink-muted">
          Set valid period from / to above to load collection summary.
        </p>
      ) : collectionLoading ? (
        <p className="mt-1.5 text-xs text-ink-muted">Loading collection…</p>
      ) : collection ? (
        <div className="mt-2 space-y-2 text-xs">
          <p className="text-ink-muted">
            Adjustments in range:{" "}
            {Object.entries(collection.adjustmentsByType || {})
              .map(([t, v]) => `${t}: ${formatCurrency(v)}`)
              .join(" · ") || "—"}
          </p>
          <ul className="max-h-28 overflow-auto rounded-xl border border-border bg-white divide-y divide-border">
            {collection.appliedFromPayouts.length === 0 ? (
              <li className="px-3 py-2 text-ink-muted">No debt_applied amounts in this window.</li>
            ) : (
              collection.appliedFromPayouts.map((r) => (
                <li key={r.periodEnd} className="flex justify-between px-3 py-1.5 tabular-nums">
                  <span className="text-ink-muted">{r.periodEnd}</span>
                  <span className="font-medium text-ink">{formatCurrency(r.collected)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
