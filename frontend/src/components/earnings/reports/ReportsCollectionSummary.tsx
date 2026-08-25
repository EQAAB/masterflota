import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  return (
    <div className={`${card} !p-4`}>
      <h3 className="text-sm font-semibold text-ink">{t("pages.earningsReports.collectionSummaryTitle")}</h3>
      {!collectionFrom || !collectionTo ? (
        <p className="mt-1.5 text-xs text-ink-muted">
          {t("pages.earningsReports.collectionSummaryHint")}
        </p>
      ) : collectionLoading ? (
        <p className="mt-1.5 text-xs text-ink-muted">{t("pages.earningsReports.loadingCollection")}</p>
      ) : collection ? (
        <div className="mt-2 space-y-2 text-xs">
          <p className="text-ink-muted">
            {t("pages.earningsReports.adjustmentsInRange", {
              items:
                Object.entries(collection.adjustmentsByType || {})
                  .map(([type, v]) => `${type}: ${formatCurrency(v)}`)
                  .join(" · ") || "—",
            })}
          </p>
          <ul className="max-h-28 overflow-auto rounded-xl border border-border bg-white divide-y divide-border">
            {collection.appliedFromPayouts.length === 0 ? (
              <li className="px-3 py-2 text-ink-muted">{t("pages.earningsReports.noDebtAppliedInWindow")}</li>
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
