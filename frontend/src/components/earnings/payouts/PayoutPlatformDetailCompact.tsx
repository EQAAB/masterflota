import type { PayoutAssignmentDetail, PayoutListItem } from "../../../api/earnings";
import { btnGhost } from "../../../theme/classNames";
import { formatCurrency } from "../../../utils/currency";
import { commissionBaseTypeLabel } from "../../../utils/commissionBaseLabels";
import {
  boltPayoutCashDeductionLabel,
  formatRatePctFromFraction,
  normalizeRentEntries,
  rentEntryTypeLabel,
  toNum,
} from "./payoutRowUtils";

type PayoutPlatformDetailCompactProps = {
  row: PayoutListItem;
  detail?: PayoutAssignmentDetail;
  canCustomFees?: boolean;
  canDebtActions?: boolean;
  canReleaseHold?: boolean;
  onOpenCustomFees?: () => void;
  onOpenDebtActions?: () => void;
  onOpenReleaseHold?: () => void;
};

function DenseMetric({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5 text-[11px]">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className={`tabular-nums text-right font-medium ${muted ? "text-slate-600" : "text-ink"}`}>
        {value}
      </span>
    </div>
  );
}

export function PayoutPlatformDetailCompact({
  row,
  detail,
  canCustomFees,
  canDebtActions,
  canReleaseHold,
  onOpenCustomFees,
  onOpenDebtActions,
  onOpenReleaseHold,
}: PayoutPlatformDetailCompactProps) {
  const rentEntries = normalizeRentEntries(row.rent_entries);
  const b = toNum(row.commission_base);
  const r = toNum(row.commission_rate);
  const c = toNum(row.company_commission);
  const netPayout = toNum(row.net_driver_payout);
  const remainingDebt = toNum(row.remaining_debt_amount);
  const isDebtPayout = netPayout < 0 || row.payment_status === "debt";
  const hasActions = canCustomFees || canDebtActions || canReleaseHold;

  return (
    <div className="fm-payout-dense-panel">
      {hasActions && (
        <div className="mb-2 flex flex-wrap gap-1">
          {canDebtActions && (
            <button type="button" className={`${btnGhost} !py-1 !text-[11px]`} onClick={onOpenDebtActions}>
              Adjust debt
            </button>
          )}
          {canCustomFees && (
            <button type="button" className={`${btnGhost} !py-1 !text-[11px]`} onClick={onOpenCustomFees}>
              Custom fees
            </button>
          )}
          {canReleaseHold && (
            <button type="button" className={`${btnGhost} !py-1 !text-[11px]`} onClick={onOpenReleaseHold}>
              Release hold
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div className="fm-payout-dense-block">
          <p className="fm-payout-dense-heading">Earnings</p>
          <DenseMetric label="Gross" value={formatCurrency(toNum(row.total_gross_earnings))} />
          <DenseMetric label="Net income" value={formatCurrency(toNum(row.net_income))} />
          <DenseMetric label="Platform net" value={formatCurrency(netPayout)} />
        </div>

        <div className="fm-payout-dense-block fm-payout-dense-block--tax">
          <p className="fm-payout-dense-heading">Tax & deductions</p>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0 text-[11px] text-violet-900">
            <span className="text-violet-600">Base {formatCurrency(b)}</span>
            <span className="text-violet-400">·</span>
            <span className="text-violet-600">{formatRatePctFromFraction(r)}</span>
            <span className="ml-auto text-sm font-bold tabular-nums text-violet-950">
              {formatCurrency(c)}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-violet-600/80">
            {commissionBaseTypeLabel(row.commission_base_type)}
          </p>
          <div className="mt-1.5 space-y-0 border-t border-violet-200/40 pt-1.5">
            <DenseMetric
              label={boltPayoutCashDeductionLabel(row)}
              value={formatCurrency(Math.abs(toNum(row.total_daily_cash)))}
              muted
            />
            <DenseMetric label="Debt applied" value={formatCurrency(toNum(row.debt_applied_amount))} muted />
            <DenseMetric label="Vehicle rent" value={formatCurrency(toNum(row.vehicle_rental_fee))} muted />
          </div>
        </div>

        <div className="fm-payout-dense-block">
          <p className="fm-payout-dense-heading">Vehicle & debt</p>
          <DenseMetric
            label="Vehicle"
            value={detail?.has_vehicle_assigned ? (detail.license_plate ?? "Assigned") : "None"}
          />
          <DenseMetric
            label="Weekly rent"
            value={detail?.weekly_rent ? formatCurrency(toNum(detail.weekly_rent)) : "—"}
            muted
          />
          <div className="mt-1">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                remainingDebt > 0 || isDebtPayout
                  ? "bg-rose-100/90 text-rose-800"
                  : "bg-emerald-100/90 text-emerald-800"
              }`}
            >
              {remainingDebt > 0
                ? `Debt ${formatCurrency(remainingDebt)}`
                : isDebtPayout
                  ? "Debt period"
                  : "Clear"}
            </span>
          </div>
          {rentEntries.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {rentEntries.slice(0, 2).map((e) => (
                <DenseMetric
                  key={e.id}
                  label={rentEntryTypeLabel(e.entry_type)}
                  value={formatCurrency(Number(e.amount) || 0)}
                  muted
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-2 font-mono text-[10px] text-slate-400">
        Payout {row.id.slice(0, 8)}… · {row.platform_id || "no platform ID"}
      </p>
    </div>
  );
}
