import type { CommissionByBaseTypeRow } from "../../../api/earnings";
import { formatCurrency } from "../../../utils/currency";
import { commissionBaseTypeLabel } from "../../../utils/commissionBaseLabels";
import { card } from "../../../theme/classNames";
import { formatAvgCommissionRate } from "./reportsDisplayUtils";

type ReportsCommissionCardProps = {
  items: CommissionByBaseTypeRow[] | undefined;
  loading?: boolean;
};

export function ReportsCommissionCard({ items, loading }: ReportsCommissionCardProps) {
  if (loading) {
    return (
      <div className={`${card} !p-4 animate-pulse`}>
        <div className="h-4 w-48 rounded bg-surface" />
        <div className="mt-2 h-3 w-full max-w-md rounded bg-surface" />
        <div className="mt-3 h-20 rounded-[14px] bg-surface" />
      </div>
    );
  }

  if (!items?.length) return null;

  return (
    <div className={`${card} !p-4`}>
      <h3 className="text-sm font-semibold text-ink">Commission by base type</h3>
      <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">
        Same filters as the table. Avg rate is the mean of stored driver nominal rates (fraction) where rate ≠ 0.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((row) => (
          <div
            key={row.commission_base_type}
            className="rounded-[14px] border border-violet-100 bg-violet-50/60 p-3"
          >
            <p className="text-xs font-semibold text-violet-900">
              {commissionBaseTypeLabel(row.commission_base_type)}
            </p>
            <div className="mt-2 space-y-1.5 border-t border-violet-100/80 pt-2 text-[11px] text-ink">
              <div className="flex justify-between gap-3">
                <span className="text-ink-muted">Payout rows</span>
                <span className="font-medium tabular-nums">{row.payoutCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-muted">Total commission</span>
                <span className="font-medium tabular-nums">{formatCurrency(row.totalCompanyCommission)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-muted">Commission base</span>
                <span className="font-medium tabular-nums">{formatCurrency(row.totalCommissionBase)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-muted">Avg nominal rate</span>
                <span className="font-semibold tabular-nums text-violet-800">
                  {formatAvgCommissionRate(row.avgCommissionRate)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
