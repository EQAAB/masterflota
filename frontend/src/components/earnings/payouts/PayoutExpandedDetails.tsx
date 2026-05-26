import { memo, type ReactNode } from "react";
import type { PayoutListItem, PayoutAssignmentDetail } from "../../../api/earnings";
import { btnGhost } from "../../../theme/classNames";
import { formatCurrency } from "../../../utils/currency";
import { commissionBaseTypeLabel } from "../../../utils/commissionBaseLabels";
import { earningsPlatformLabel } from "../../../utils/earningsPlatformLabel";
import { HighlightText } from "./HighlightText";
import {
  boltPayoutCashDeductionLabel,
  formatRatePctFromFraction,
  normalizeRentEntries,
  rentEntryTypeLabel,
  toNum,
} from "./payoutRowUtils";

type PayoutExpandedDetailsProps = {
  row: PayoutListItem;
  detail?: PayoutAssignmentDetail;
  debouncedQuery: string;
  compact?: boolean;
  canCustomFees?: boolean;
  canDebtActions?: boolean;
  canReleaseHold?: boolean;
  onOpenCustomFees?: () => void;
  onOpenDebtActions?: () => void;
  onOpenReleaseHold?: () => void;
};

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-border/60 bg-white/80 p-3 ${className}`}>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</h4>
      <div className="mt-2 space-y-1 text-xs text-ink">{children}</div>
    </section>
  );
}

export const PayoutExpandedDetails = memo(function PayoutExpandedDetails({
  row,
  detail,
  debouncedQuery,
  compact = false,
  canCustomFees,
  canDebtActions,
  canReleaseHold,
  onOpenCustomFees,
  onOpenDebtActions,
  onOpenReleaseHold,
}: PayoutExpandedDetailsProps) {
  const rentEntries = normalizeRentEntries(row.rent_entries);
  const b = toNum(row.commission_base);
  const r = toNum(row.commission_rate);
  const c = toNum(row.company_commission);
  const nominal = b > 0 && r > 0 && r <= 1 ? b * r : 0;
  const showEffectiveRate = b > 0.001 && nominal > 0 && Math.abs(c - nominal) > 0.02;
  const hasQuickActions = canCustomFees || canDebtActions || canReleaseHold;
  const driverName = `${row.first_name} ${row.last_name}`;

  return (
    <div className="space-y-4 text-xs text-ink">
      <div className={`grid grid-cols-1 gap-3 ${compact ? "" : "md:grid-cols-2 xl:grid-cols-3"}`}>
        <Section title="Driver">
          <p className="font-medium text-sm text-ink">
            <HighlightText text={driverName} query={debouncedQuery} />
          </p>
          <p>
            Phone:{" "}
            <HighlightText text={row.phone || "—"} query={debouncedQuery} />
          </p>
          <p>
            Platform:{" "}
            <span className="font-medium">
              <HighlightText text={earningsPlatformLabel(row.earnings_platform)} query={debouncedQuery} />
            </span>
          </p>
          <p>
            Account ID:{" "}
            <span className="font-mono">
              <HighlightText text={row.platform_id || "—"} query={debouncedQuery} />
            </span>
          </p>
        </Section>

        <Section title="Earnings breakdown" className={compact ? "md:col-span-2" : "md:col-span-2 xl:col-span-2"}>
          <p>Base income: {formatCurrency(toNum(row.income))}</p>
          <p>Tips: {formatCurrency(toNum(row.tips))}</p>
          {!compact && <p>Gross (Income + Tips): {formatCurrency(toNum(row.total_gross_earnings))}</p>}
          {compact ? (
            <p>Gross: {formatCurrency(toNum(row.total_gross_earnings))}</p>
          ) : (
            <p>Platform fees (Taxa): {formatCurrency(toNum(row.total_platform_fees))}</p>
          )}
          {compact && <p>Platform fees: {formatCurrency(toNum(row.total_platform_fees))}</p>}
          <p>Net income: {formatCurrency(toNum(row.net_income))}</p>
          <div className="mt-2 rounded-lg border border-violet-200/80 bg-violet-50/80 px-3 py-2 text-[11px] text-violet-950">
            <p className="font-semibold text-violet-900">Commission</p>
            <p className="mt-1">
              Base: {formatCurrency(b)}{" "}
              <span className="text-violet-700">({commissionBaseTypeLabel(row.commission_base_type)})</span>
            </p>
            <p>Rate{compact ? "" : " (driver)"}: {formatRatePctFromFraction(r)}</p>
            <p className="font-semibold">Charged: {formatCurrency(c)}</p>
            {showEffectiveRate && (
              <p className="mt-1 text-violet-800">
                Effective rate on base: {`${((c / b) * 100).toFixed(2).replace(/\.?0+$/, "")}%`} (fixed / hybrid /
                minimum)
              </p>
            )}
          </div>
          <p className="mt-2">
            {boltPayoutCashDeductionLabel(row)}: {formatCurrency(Math.abs(toNum(row.total_daily_cash)))}
          </p>
          <p>Account opening fee (deduction): {formatCurrency(Math.abs(toNum(row.account_opening_fee)))}</p>
          <p>Raw net: {formatCurrency(toNum(row.raw_net_amount))}</p>
          <p className="font-semibold text-ink">
            Net payout: {formatCurrency(toNum(row.net_driver_payout))}
          </p>
        </Section>

        <Section title="Debt">
          <p>Debt applied: {formatCurrency(toNum(row.debt_applied_amount))}</p>
          <p className="font-semibold text-red-700">
            Remaining debt: {formatCurrency(toNum(row.remaining_debt_amount))}
          </p>
          <p>Status: {row.payment_status}</p>
          <p>Paid on: {row.payment_date?.slice(0, 10) ?? "—"}</p>
        </Section>

        <Section title="Vehicle">
          <p>Assigned: {detail?.has_vehicle_assigned ? "Yes" : "No"}</p>
          <p>Plate: {detail?.license_plate ?? "—"}</p>
          <p>
            Weekly rent: {detail?.weekly_rent ? formatCurrency(toNum(detail.weekly_rent)) : "—"}
          </p>
          <p className="text-amber-800">Vehicle rental: {formatCurrency(toNum(row.vehicle_rental_fee))}</p>
          {rentEntries.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-amber-900/90">
              {rentEntries.map((e) => (
                <li key={e.id}>
                  {rentEntryTypeLabel(e.entry_type)}: {formatCurrency(Number(e.amount) || 0)}
                  {e.description ? <span className="text-ink-muted"> — {e.description}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {(row.hold_reason || row.hold_notes || row.hold_released_at) && (
          <Section title="Notes / hold">
            {row.hold_reason && <p>Hold reason: {row.hold_reason}</p>}
            {row.hold_released_at && (
              <p>
                Released: {row.hold_released_at.slice(0, 10)}
                {row.hold_released_by_name ? ` by ${row.hold_released_by_name}` : ""}
              </p>
            )}
            {row.hold_notes && <p>Release notes: {row.hold_notes}</p>}
          </Section>
        )}

        {!compact && (
          <Section title="Reference" className="md:col-span-2 xl:col-span-3">
            <p>Payout ID: {row.id}</p>
          </Section>
        )}
      </div>

      {hasQuickActions && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          <span className="text-[10px] font-medium uppercase tracking-wide text-ink-muted mr-1">
            Quick actions
          </span>
          {canDebtActions && (
            <button type="button" className={btnGhost} onClick={() => onOpenDebtActions?.()}>
              Adjust debt
            </button>
          )}
          {canCustomFees && (
            <button type="button" className={btnGhost} onClick={() => onOpenCustomFees?.()}>
              Custom fees
            </button>
          )}
          {canReleaseHold && (
            <button type="button" className={btnGhost} onClick={() => onOpenReleaseHold?.()}>
              Release hold
            </button>
          )}
        </div>
      )}
    </div>
  );
});
