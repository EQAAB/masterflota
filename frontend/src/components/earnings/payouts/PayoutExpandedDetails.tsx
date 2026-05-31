import { memo, type ReactNode } from "react";
import type { PayoutListItem, PayoutAssignmentDetail } from "../../../api/earnings";
import { PlatformBadge, type PlatformBadgeKey } from "../../drivers/platformLogos";
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

function PanelSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`fm-payout-panel-section h-full ${className}`}>
      <h4 className="fm-payout-panel-title mb-2.5">{title}</h4>
      {children}
    </section>
  );
}

function MetricRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5 text-sm">
      <span className="text-ink-muted shrink-0">{label}</span>
      <span className={`tabular-nums text-right ${strong ? "font-semibold text-ink" : "font-medium text-ink"}`}>
        {value}
      </span>
    </div>
  );
}

function platformBadgeKey(platform: string | null | undefined): PlatformBadgeKey | null {
  const p = (platform ?? "").toLowerCase();
  if (p === "bolt" || p === "bolt_taxi" || p === "glovo" || p === "uber" || p === "wolt") return p;
  return null;
}

function BanknotesIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-600/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
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
  const netPayout = toNum(row.net_driver_payout);
  const isDebtPayout = netPayout < 0 || row.payment_status === "debt";
  const remainingDebt = toNum(row.remaining_debt_amount);
  const badgeKey = platformBadgeKey(row.earnings_platform);

  return (
    <div className="space-y-3 text-ink">
      <div className={`grid grid-cols-1 gap-3 ${compact ? "" : "lg:grid-cols-12"}`}>
        {/* 1. Driver */}
        <PanelSection title="Driver" className={compact ? "" : "lg:col-span-3"}>
          <p className="text-base font-semibold text-ink">
            <HighlightText text={driverName} query={debouncedQuery} />
          </p>
          <p className="mt-1.5 text-xs text-ink-muted">
            <HighlightText text={row.phone || "No phone"} query={debouncedQuery} />
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {badgeKey ? (
              <PlatformBadge platform={badgeKey} compact />
            ) : (
              <span className="text-xs font-medium text-ink">
                {earningsPlatformLabel(row.earnings_platform)}
              </span>
            )}
          </div>
          <p className="mt-2 font-mono text-[11px] text-ink-muted">
            ID: <HighlightText text={row.platform_id || "—"} query={debouncedQuery} />
          </p>
        </PanelSection>

        {/* 2. Platform breakdown */}
        <PanelSection
          title="Platform breakdown"
          className={compact ? "md:col-span-2" : "lg:col-span-5"}
        >
          <div className="space-y-0.5">
            <MetricRow label="Base income" value={formatCurrency(toNum(row.income))} />
            <MetricRow label="Tips" value={formatCurrency(toNum(row.tips))} />
            <MetricRow label="Gross (income + tips)" value={formatCurrency(toNum(row.total_gross_earnings))} />
            {!compact && (
              <MetricRow label="Platform fees (Taxa)" value={formatCurrency(toNum(row.total_platform_fees))} />
            )}
            <MetricRow label="Net income" value={formatCurrency(toNum(row.net_income))} strong />
          </div>
        </PanelSection>

        {/* 3. Unified tax & commission */}
        <div className={compact ? "" : "lg:col-span-4"}>
          <div className="fm-payout-tax-card h-full">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-violet-800/90">
              Unified tax & commission
            </h4>
            <div className="mt-3 space-y-1 text-sm text-violet-950">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-violet-700/90">Base</span>
                <span className="font-semibold tabular-nums">{formatCurrency(b)}</span>
                <span className="text-[11px] text-violet-600">
                  ({commissionBaseTypeLabel(row.commission_base_type)})
                </span>
              </div>
              <p>
                Rate: <span className="font-semibold tabular-nums">{formatRatePctFromFraction(r)}</span>
              </p>
              <div className="mt-2 rounded-lg bg-white/70 px-2.5 py-2 ring-1 ring-violet-200/50">
                <p className="text-[10px] font-medium uppercase tracking-wide text-violet-700">Charged</p>
                <p className="text-lg font-bold tabular-nums text-violet-950">{formatCurrency(c)}</p>
              </div>
              {showEffectiveRate && (
                <p className="text-[11px] text-violet-800">
                  Effective on base: {`${((c / b) * 100).toFixed(2).replace(/\.?0+$/, "")}%`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 4. Deductions & final payout */}
        <div className={`grid grid-cols-1 gap-3 ${compact ? "" : "lg:col-span-8 lg:grid-cols-2"}`}>
          <PanelSection title="Deductions">
            <div className="space-y-0.5">
              <MetricRow
                label={boltPayoutCashDeductionLabel(row)}
                value={formatCurrency(Math.abs(toNum(row.total_daily_cash)))}
              />
              <MetricRow
                label="Account opening fee"
                value={formatCurrency(Math.abs(toNum(row.account_opening_fee)))}
              />
              <MetricRow label="Debt applied" value={formatCurrency(toNum(row.debt_applied_amount))} />
              <MetricRow label="Vehicle rental" value={formatCurrency(toNum(row.vehicle_rental_fee))} />
              <MetricRow label="Raw net" value={formatCurrency(toNum(row.raw_net_amount))} />
            </div>
          </PanelSection>

          <div
            className={`fm-payout-final-card flex flex-col justify-between min-h-[140px] ${
              isDebtPayout ? "fm-payout-final-card--debt" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/90">
                  Final payout
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums leading-none sm:text-[2rem]">
                  {formatCurrency(netPayout)}
                </p>
                <p className="mt-1.5 text-[11px] capitalize text-ink-muted">
                  Status: {row.payment_status}
                  {row.payment_date ? ` · Paid ${row.payment_date.slice(0, 10)}` : ""}
                </p>
              </div>
              <span className="fm-payout-final-icon" aria-hidden>
                <BanknotesIcon />
              </span>
            </div>
          </div>
        </div>

        {/* 5. Vehicle & debt overview */}
        <PanelSection title="Vehicle & debt overview" className={compact ? "" : "lg:col-span-4"}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">Vehicle</p>
              <p className="mt-0.5 font-medium">{detail?.has_vehicle_assigned ? "Assigned" : "None"}</p>
              <p className="text-xs text-ink-muted">{detail?.license_plate ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">Weekly rent</p>
              <p className="mt-0.5 font-medium tabular-nums">
                {detail?.weekly_rent ? formatCurrency(toNum(detail.weekly_rent)) : "—"}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                remainingDebt > 0 || isDebtPayout
                  ? "bg-rose-50 text-rose-800 ring-rose-200/80"
                  : "bg-emerald-50 text-emerald-800 ring-emerald-200/80"
              }`}
            >
              {remainingDebt > 0
                ? `Debt ${formatCurrency(remainingDebt)}`
                : isDebtPayout
                  ? "Debt period"
                  : "No open debt"}
            </span>
          </div>
          {rentEntries.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-border/50 pt-2 text-xs">
              {rentEntries.map((e) => (
                <li key={e.id} className="flex justify-between gap-2">
                  <span className="text-ink-muted">{rentEntryTypeLabel(e.entry_type)}</span>
                  <span className="font-medium tabular-nums text-amber-900">
                    {formatCurrency(Number(e.amount) || 0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {(row.hold_reason || row.hold_notes) && (
            <div className="mt-2 rounded-lg bg-amber-50/80 px-2 py-1.5 text-[11px] text-amber-900">
              {row.hold_reason && <p>Hold: {row.hold_reason}</p>}
              {row.hold_notes && <p className="mt-0.5">{row.hold_notes}</p>}
            </div>
          )}
        </PanelSection>

        {/* 6. Reference */}
        {!compact && (
          <PanelSection title="Reference" className="lg:col-span-12">
            <p className="font-mono text-[11px] text-ink-muted break-all">Payout ID: {row.id}</p>
          </PanelSection>
        )}
      </div>

      {hasQuickActions && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
