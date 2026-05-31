import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { ConsolidatedDriverPayout, PayoutAssignmentDetail, PayoutListItem } from "../../../api/earnings";
import {
  BoltPlatformLogo,
  PlatformBadge,
  UberPlatformLogo,
  type PlatformBadgeKey,
} from "../../drivers/platformLogos";
import { btnSecondary } from "../../../theme/classNames";
import { formatCurrency } from "../../../utils/currency";
import { earningsPlatformLabel } from "../../../utils/earningsPlatformLabel";
import { formatRatePctFromFraction, toNum } from "./payoutRowUtils";
import {
  computeUnifiedBreakdown,
  formatPeriodParts,
  platformShortId,
} from "./payoutBreakdownUtils";

export type CombinedPayoutDetailsContentProps = {
  row: ConsolidatedDriverPayout;
  payoutItems: PayoutListItem[];
  detailsById: Map<string, PayoutAssignmentDetail>;
  isPaying?: boolean;
  onPay?: () => void;
  onOpenDebtActions?: (payout: PayoutListItem) => void;
  onOpenCustomFees?: (payout: PayoutListItem) => void;
  onOpenReleaseHold?: (payout: PayoutListItem) => void;
  onDownloadReport?: () => void;
  onPrint?: () => void;
  downloadBusy?: boolean;
};

const STATUS_DISPLAY: Record<string, string> = {
  payable: "Pending",
  paid: "Paid",
  debt: "Debt",
  hold: "On hold",
  partial: "Partial",
  mixed: "Mixed",
};

function statusBadgeClass(status: string): string {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200/60";
    case "payable":
      return "bg-amber-100 text-amber-900 ring-amber-200/60";
    case "debt":
      return "bg-rose-100 text-rose-800 ring-rose-200/60";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200/60";
  }
}

function platformBadgeKey(platform: string): PlatformBadgeKey | null {
  const p = platform.toLowerCase();
  if (p === "bolt" || p === "bolt_taxi" || p === "glovo" || p === "uber" || p === "wolt") return p;
  return null;
}

function PlatformLogo({ platform, size = "md" }: { platform: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "!h-7 !w-7 !rounded-lg" : "!h-9 !w-9 !rounded-xl";
  const p = platform.toLowerCase();
  if (p === "uber") return <UberPlatformLogo className={cls} />;
  if (p === "bolt" || p === "bolt_taxi") return <BoltPlatformLogo className={cls} />;
  const key = platformBadgeKey(platform);
  if (key) return <PlatformBadge platform={key} compact />;
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-xs font-bold text-slate-600">
      {platform.slice(0, 1).toUpperCase()}
    </span>
  );
}

function LineRow({
  label,
  value,
  variant = "neutral",
  bold,
}: {
  label: string;
  value: ReactNode;
  variant?: "neutral" | "deduction" | "positive";
  bold?: boolean;
}) {
  const valueClass =
    variant === "deduction"
      ? "text-rose-700"
      : variant === "positive"
        ? "text-emerald-800 font-semibold"
        : "text-ink";
  return (
    <div className={`fm-payout-detail-line ${bold ? "fm-payout-detail-line--bold" : ""}`}>
      <span className="fm-payout-detail-line__label">{label}</span>
      <span className={`fm-payout-detail-line__value tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function ActionsMenu({
  row,
  canPay,
  isPaying,
  onPay,
  onDownloadReport,
  onPrint,
  onOpenDebtActions,
  onOpenCustomFees,
  onOpenReleaseHold,
  actionPayout,
}: {
  row: ConsolidatedDriverPayout;
  canPay: boolean;
  isPaying?: boolean;
  onPay?: () => void;
  onDownloadReport?: () => void;
  onPrint?: () => void;
  onOpenDebtActions?: (p: PayoutListItem) => void;
  onOpenCustomFees?: (p: PayoutListItem) => void;
  onOpenReleaseHold?: (p: PayoutListItem) => void;
  actionPayout?: PayoutListItem;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-ink"
        aria-label="More actions"
        onClick={() => setOpen((v) => !v)}
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-10" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <Link
              to={`/drivers/${row.driver_id}`}
              className="block px-3 py-2 text-xs text-ink hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              View driver profile
            </Link>
            {canPay && onPay && (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs text-ink hover:bg-slate-50"
                disabled={isPaying}
                onClick={() => {
                  setOpen(false);
                  onPay();
                }}
              >
                Pay now
              </button>
            )}
            {actionPayout && onOpenCustomFees && (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs text-ink hover:bg-slate-50"
                onClick={() => {
                  setOpen(false);
                  onOpenCustomFees(actionPayout);
                }}
              >
                Custom fees
              </button>
            )}
            {actionPayout && onOpenDebtActions && (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs text-ink hover:bg-slate-50"
                onClick={() => {
                  setOpen(false);
                  onOpenDebtActions(actionPayout);
                }}
              >
                Adjust debt
              </button>
            )}
            {actionPayout && onOpenReleaseHold && actionPayout.payment_status === "hold" && (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs text-ink hover:bg-slate-50"
                onClick={() => {
                  setOpen(false);
                  onOpenReleaseHold(actionPayout);
                }}
              >
                Release hold
              </button>
            )}
            {onDownloadReport && (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs text-ink hover:bg-slate-50"
                onClick={() => {
                  setOpen(false);
                  onDownloadReport();
                }}
              >
                Download report
              </button>
            )}
            {onPrint && (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs text-ink hover:bg-slate-50"
                onClick={() => {
                  setOpen(false);
                  onPrint();
                }}
              >
                Print
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function primaryPayoutForActions(items: PayoutListItem[]): PayoutListItem | undefined {
  return items.find((p) => p.payment_status === "hold") ?? items[0];
}

function aggregateVehicle(detailsById: Map<string, PayoutAssignmentDetail>, items: PayoutListItem[]) {
  for (const p of items) {
    const d = detailsById.get(p.id);
    if (d) return d;
  }
  return undefined;
}

export function CombinedPayoutDetailsContent({
  row,
  payoutItems,
  detailsById,
  isPaying,
  onPay,
  onOpenDebtActions,
  onOpenCustomFees,
  onOpenReleaseHold,
  onDownloadReport,
  onPrint,
  downloadBusy,
}: CombinedPayoutDetailsContentProps) {
  const breakdown = useMemo(() => computeUnifiedBreakdown(row, payoutItems), [row, payoutItems]);
  const vehicleDetail = aggregateVehicle(detailsById, payoutItems);
  const actionPayout = primaryPayoutForActions(payoutItems);
  const statusLabel = STATUS_DISPLAY[row.consolidated_status] ?? row.consolidated_status.replace(/_/g, " ");
  const taxRateLabel = breakdown.taxRate > 0 ? formatRatePctFromFraction(breakdown.taxRate) : "—";
  const periodParts = formatPeriodParts(row.payment_period_start, row.payment_period_end);
  const initials = `${row.first_name.charAt(0)}${row.last_name.charAt(0)}`.toUpperCase();

  const debtApplied = payoutItems.reduce((s, p) => s + toNum(p.debt_applied_amount), 0);
  const remainingDebt = payoutItems.reduce((m, p) => Math.max(m, toNum(p.remaining_debt_amount)), 0);
  const weeklyRent = vehicleDetail?.weekly_rent ? toNum(vehicleDetail.weekly_rent) : breakdown.vehicleRent;

  const statementUrl = `/earnings/reports?driverId=${encodeURIComponent(row.driver_id)}&from=${encodeURIComponent(row.payment_period_start.slice(0, 10))}&to=${encodeURIComponent(row.payment_period_end.slice(0, 10))}`;

  return (
    <div className="fm-payout-detail-page">
      {/* Top driver summary bar */}
      <section className="fm-payout-detail-summary">
        <div className="fm-payout-detail-summary__block fm-payout-detail-summary__driver">
          <span className="fm-payout-detail-avatar" aria-hidden>
            {initials}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink truncate">
              {row.first_name} {row.last_name}
            </p>
            <p className="text-xs text-slate-500">{row.phone || "No phone on file"}</p>
            <p className="mt-1 font-mono text-[10px] text-slate-400 truncate" title={row.driver_id}>
              Account ID: {row.driver_id}
            </p>
          </div>
        </div>

        <div className="fm-payout-detail-summary__block">
          <p className="fm-payout-detail-summary__label">Platforms</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {row.platforms.map((p) => (
              <PlatformLogo key={p} platform={p} size="sm" />
            ))}
          </div>
        </div>

        <div className="fm-payout-detail-summary__block">
          <p className="fm-payout-detail-summary__label">Period</p>
          <p className="mt-1 text-sm font-semibold text-ink">{periodParts?.range ?? "—"}</p>
          {periodParts && <p className="text-xs text-slate-500">{periodParts.year}</p>}
        </div>

        <div className="fm-payout-detail-summary__block">
          <p className="fm-payout-detail-summary__label">Status</p>
          <span
            className={`mt-1.5 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusBadgeClass(row.consolidated_status)}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="fm-payout-detail-summary__block fm-payout-detail-summary__amount">
          <p className="fm-payout-detail-summary__label">Final net payout</p>
          <p className="fm-payout-detail-summary__value tabular-nums">{formatCurrency(breakdown.finalNet)}</p>
        </div>

        <div className="fm-payout-detail-summary__block fm-payout-detail-summary__actions">
          {row.can_pay && onPay ? (
            <button type="button" disabled={isPaying} className="fm-payout-pay-btn !px-5 !py-2.5 !text-sm" onClick={onPay}>
              {isPaying ? "Paying…" : "Pay now"}
            </button>
          ) : (
            <span className="text-xs text-slate-500">Not payable</span>
          )}
          <ActionsMenu
            row={row}
            canPay={row.can_pay}
            isPaying={isPaying}
            onPay={onPay}
            onDownloadReport={onDownloadReport}
            onPrint={onPrint}
            onOpenDebtActions={onOpenDebtActions}
            onOpenCustomFees={onOpenCustomFees}
            onOpenReleaseHold={onOpenReleaseHold}
            actionPayout={actionPayout}
          />
        </div>
      </section>

      {/* Platform cards */}
      <div className="fm-payout-detail-platforms">
        {breakdown.platforms.map((line) => {
          const title =
            line.platform.toLowerCase() === "uber"
              ? "Uber Earnings"
              : line.platform.toLowerCase().includes("bolt")
                ? "Bolt Earnings"
                : `${earningsPlatformLabel(line.platform)} Earnings`;
          return (
            <article key={line.payoutId} className="fm-payout-detail-platform-card">
              <div className="fm-payout-detail-platform-card__head">
                <div className="flex items-center gap-2.5 min-w-0">
                  <PlatformLogo platform={line.platform} />
                  <h2 className="text-base font-semibold text-ink">{title}</h2>
                </div>
                <span className="fm-payout-detail-id-badge">ID: {platformShortId(line.platform, line.payoutId)}</span>
              </div>
              <div className="fm-payout-detail-platform-card__body">
                <LineRow label="Base income" value={formatCurrency(line.baseIncome)} />
                <LineRow label="Tips" value={formatCurrency(line.tips)} />
                <LineRow label="Gross (Income + Tips)" value={formatCurrency(line.gross)} bold />
                <LineRow label="Platform fees (Taxa)" value={formatCurrency(-line.platformFees)} variant="deduction" />
                <LineRow label="Fleet / Subscription" value={formatCurrency(-line.fleetSub)} variant="deduction" />
                <div className="fm-payout-detail-platform-net">
                  <span>Net from {earningsPlatformLabel(line.platform)}</span>
                  <span className="tabular-nums">{formatCurrency(line.netFromPlatform)}</span>
                </div>
              </div>
              <div className="fm-payout-detail-commission-box">
                <p className="fm-payout-detail-commission-box__title">Commission (after platform fee)</p>
                <LineRow label="Base" value={formatCurrency(line.commissionBase)} />
                <LineRow label="Rate (driver)" value={formatRatePctFromFraction(line.commissionRate)} />
                <LineRow label="Commission charged" value={formatCurrency(line.commissionCharged)} bold />
              </div>
            </article>
          );
        })}
      </div>

      {/* Combined summary + Final payout */}
      <div className="fm-payout-detail-main-grid">
        <section className="fm-payout-detail-combined">
          <h2 className="fm-payout-detail-combined__title">Combined Earnings Summary</h2>
          <div className="fm-payout-detail-combined__body">
            <LineRow label="Total gross income (Uber + Bolt)" value={formatCurrency(breakdown.totalGross)} bold />
            <LineRow label="Total platform fees (Taxa)" value={formatCurrency(-breakdown.totalPlatformFees)} variant="deduction" />
            <LineRow label="Total fleet / subscription" value={formatCurrency(-breakdown.totalFleetSub)} variant="deduction" />
            <LineRow label="Combined net before vehicle rent" value={formatCurrency(breakdown.combinedNetBeforeRent)} bold />

            <div className="fm-payout-detail-deduct-band fm-payout-detail-deduct-band--rent">
              <div>
                <p className="font-semibold text-ink">Vehicle rent</p>
                <p className="text-xs text-slate-500">Weekly rent</p>
              </div>
              <span className="tabular-nums text-base font-bold text-orange-700">
                {breakdown.vehicleRent > 0 ? formatCurrency(-breakdown.vehicleRent) : formatCurrency(0)}
              </span>
            </div>

            <LineRow label="Taxable amount (after vehicle rent)" value={formatCurrency(breakdown.taxableAmount)} bold />

            <div className="fm-payout-detail-deduct-band fm-payout-detail-deduct-band--tax">
              <div>
                <p className="font-semibold text-ink">Taxes &amp; deductions</p>
                <p className="text-xs text-slate-500">
                  Tax ({taxRateLabel} on taxable amount)
                </p>
              </div>
              <span className="tabular-nums text-base font-bold text-rose-700">{formatCurrency(-breakdown.taxAmount)}</span>
            </div>

            {breakdown.otherDeductions > 0.02 && (
              <LineRow
                label="Other deductions (cash, fees, debt)"
                value={formatCurrency(-breakdown.otherDeductions)}
                variant="deduction"
              />
            )}

            <div className="fm-payout-detail-result-row">
              <span>Final net payout (after vehicle rent &amp; tax)</span>
              <span className="tabular-nums">{formatCurrency(breakdown.finalNet)}</span>
            </div>
          </div>
        </section>

        <section className="fm-payout-detail-final-panel">
          <div className="fm-payout-detail-final-panel__head">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-700/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h2 className="text-base font-bold text-emerald-950">Final Payout</h2>
            </div>
          </div>

          <div className="fm-payout-detail-final-panel__hero">
            <div>
              <p className="text-sm font-semibold text-emerald-900">Final net payout</p>
              <p className="text-xs text-slate-600">Amount to be paid to driver</p>
            </div>
            <p className="fm-payout-detail-final-panel__amount tabular-nums">{formatCurrency(breakdown.finalNet)}</p>
          </div>

          <div className="fm-payout-detail-final-panel__meta">
            <div>
              <p className="fm-payout-detail-meta-label">Payout to</p>
              <p className="font-medium text-ink">{row.first_name} {row.last_name}</p>
              <p className="text-xs text-slate-500">{row.phone || "—"}</p>
            </div>
            <div>
              <p className="fm-payout-detail-meta-label">Payout ID</p>
              <p className="font-mono text-[11px] text-ink break-all">{breakdown.payoutId}</p>
            </div>
            <div>
              <p className="fm-payout-detail-meta-label">Status</p>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusBadgeClass(row.consolidated_status)}`}>
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="fm-payout-detail-final-panel__actions">
            {row.can_pay && onPay ? (
              <button type="button" disabled={isPaying} className="fm-payout-pay-btn flex-1 !py-3 !text-sm" onClick={onPay}>
                {isPaying ? "Paying…" : "Pay now"}
              </button>
            ) : (
              <div className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-center text-xs text-slate-500">Payment not available</div>
            )}
            <ActionsMenu
              row={row}
              canPay={row.can_pay}
              isPaying={isPaying}
              onPay={onPay}
              onDownloadReport={onDownloadReport}
              onPrint={onPrint}
              onOpenDebtActions={onOpenDebtActions}
              onOpenCustomFees={onOpenCustomFees}
              onOpenReleaseHold={onOpenReleaseHold}
              actionPayout={actionPayout}
            />
          </div>
        </section>
      </div>

      {/* Bottom supporting cards */}
      <div className="fm-payout-detail-bottom-grid">
        <article className="fm-payout-detail-mini-card">
          <h3 className="fm-payout-detail-mini-card__title">Debt</h3>
          <LineRow label="Debt applied" value={formatCurrency(debtApplied)} />
          <LineRow label="Remaining debt" value={formatCurrency(remainingDebt)} variant={remainingDebt > 0 ? "deduction" : "neutral"} />
          <LineRow label="Status" value={statusLabel} />
          <LineRow label="Paid on" value={row.paid_at ? row.paid_at.slice(0, 10) : "—"} />
        </article>

        <article className="fm-payout-detail-mini-card">
          <h3 className="fm-payout-detail-mini-card__title">Vehicle</h3>
          <LineRow label="Assigned" value={vehicleDetail?.has_vehicle_assigned ? "Yes" : "No"} />
          <LineRow label="Plate" value={vehicleDetail?.license_plate ?? "—"} />
          <LineRow label="Weekly rent" value={weeklyRent > 0 ? formatCurrency(weeklyRent) : "—"} />
          {breakdown.vehicleRent > 0 && (
            <p className="mt-2 text-xs font-medium text-emerald-700">Vehicle rent included in combined payout</p>
          )}
        </article>

        <article className="fm-payout-detail-mini-card">
          <h3 className="fm-payout-detail-mini-card__title">Reference</h3>
          <p className="fm-payout-detail-meta-label">Payout ID</p>
          <p className="font-mono text-[11px] text-ink break-all">{breakdown.payoutId}</p>
        </article>

        <article className="fm-payout-detail-mini-card">
          <h3 className="fm-payout-detail-mini-card__title">Quick actions</h3>
          <div className="mt-1 space-y-2">
            <button
              type="button"
              disabled={downloadBusy}
              className={`${btnSecondary} w-full !justify-start !gap-2 !py-2 !text-xs`}
              onClick={onDownloadReport}
            >
              <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {downloadBusy ? "Downloading…" : "Download report"}
            </button>
            <button type="button" className={`${btnSecondary} w-full !justify-start !gap-2 !py-2 !text-xs`} onClick={onPrint}>
              <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <Link to={statementUrl} className={`${btnSecondary} w-full !justify-start !gap-2 !py-2 !text-xs`}>
              <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View statement
            </Link>
          </div>
        </article>
      </div>

      <p className="fm-payout-detail-footnote">
        All amounts are in RON · Values are calculated based on the selected period
      </p>
    </div>
  );
}
