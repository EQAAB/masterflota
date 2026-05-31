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

function platformAdjustmentLabel(platform: string): string {
  if (platform.toLowerCase().includes("bolt")) {
    return "Platform net adjustment (Bolt reported net earnings)";
  }
  return "Platform net adjustment";
}

function platformAdjustmentHint(platform: string): string {
  if (platform.toLowerCase().includes("bolt")) {
    return "Bolt net income comes from the platform export, not always gross − taxa.";
  }
  return "Difference between gross − taxa and stored net income.";
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

function SummaryStep({
  step,
  kind,
  prefix,
  label,
  value,
  hint,
}: {
  step: number;
  kind: "neutral" | "deduction" | "total" | "final" | "final-debt";
  prefix?: "-" | "=" | "";
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  const rowClass =
    kind === "final"
      ? "fm-payout-detail-step fm-payout-detail-step--final"
      : kind === "final-debt"
        ? "fm-payout-detail-step fm-payout-detail-step--final-debt"
        : kind === "total"
          ? "fm-payout-detail-step fm-payout-detail-step--total"
          : kind === "deduction"
            ? "fm-payout-detail-step fm-payout-detail-step--deduct"
            : "fm-payout-detail-step";
  const valueClass =
    kind === "final"
      ? "text-emerald-900 font-bold"
      : kind === "final-debt"
        ? "text-rose-900 font-bold"
        : kind === "total"
          ? "text-violet-950 font-semibold"
          : kind === "deduction"
            ? "text-rose-700 font-semibold"
            : "text-ink font-medium";
  return (
    <div className={rowClass}>
      <div className="fm-payout-detail-step__left min-w-0">
        <div className="flex items-start gap-2">
          <span className="fm-payout-detail-step__num">{step}</span>
          <div className="min-w-0">
            <p className="text-sm text-ink">
              {prefix && <span className="mr-1 font-medium text-slate-400">{prefix}</span>}
              {label}
            </p>
            {hint && <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{hint}</p>}
          </div>
        </div>
      </div>
      <span className={`fm-payout-detail-step__value tabular-nums shrink-0 ${valueClass}`}>{value}</span>
    </div>
  );
}

function MiniCardHeading({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <h3 className="fm-payout-detail-mini-card__title flex items-center gap-2">
      <span className="text-slate-400">{icon}</span>
      {title}
    </h3>
  );
}

function LineRow({
  label,
  value,
  variant = "neutral",
  bold,
  hint,
}: {
  label: string;
  value: ReactNode;
  variant?: "neutral" | "deduction" | "positive";
  bold?: boolean;
  hint?: string;
}) {
  const valueClass =
    variant === "deduction"
      ? "text-rose-700"
      : variant === "positive"
        ? "text-emerald-800 font-semibold"
        : "text-ink";
  return (
    <div className={`fm-payout-detail-line ${bold ? "fm-payout-detail-line--bold" : ""}`}>
      <div className="min-w-0">
        <span className="fm-payout-detail-line__label">{label}</span>
        {hint && <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{hint}</p>}
      </div>
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
  const periodParts = formatPeriodParts(row.payment_period_start, row.payment_period_end);
  const initials = `${row.first_name.charAt(0)}${row.last_name.charAt(0)}`.toUpperCase();

  const debtApplied = payoutItems.reduce((s, p) => s + toNum(p.debt_applied_amount), 0);
  const remainingDebt = payoutItems.reduce((m, p) => Math.max(m, toNum(p.remaining_debt_amount)), 0);
  const weeklyRent = vehicleDetail?.weekly_rent ? toNum(vehicleDetail.weekly_rent) : breakdown.customFeeVehicleRent;
  const isDebtPayout = breakdown.finalNet < -0.02 || row.consolidated_status === "debt";

  const cashBreakdownHint = breakdown.platforms
    .map((p) => `${earningsPlatformLabel(p.platform)}: ${formatCurrency(-p.cashBalance)}`)
    .join("  +  ");
  const platformNetHint = breakdown.platforms
    .map((p) => `${earningsPlatformLabel(p.platform)} ${formatCurrency(p.netPayoutFromPlatform)}`)
    .join("  +  ");

  /** Short ladder: what the driver actually gets paid (uses pooled raw net per platform). */
  const finalPayoutSteps = useMemo(() => {
    type StepKind = "neutral" | "deduction" | "total" | "final" | "final-debt";
    type StepDef = { kind: StepKind; prefix?: "-" | "=" | ""; label: string; amount: number; hint?: string };
    const steps: StepDef[] = [];

    for (const p of breakdown.platforms) {
      if (Math.abs(p.rawNet) <= 0.02) continue;
      steps.push({
        kind: p.rawNet > 0 ? "neutral" : "deduction",
        label: `${earningsPlatformLabel(p.platform)} this week`,
        amount: p.rawNet,
        hint:
          p.rawNet < -0.02
            ? "Platform costs exceed earnings after fees & cash"
            : undefined,
      });
    }

    const combinedHint =
      breakdown.platforms.length > 1 && breakdown.crossPlatformDebtOffset > 0.02
        ? `${formatCurrency(breakdown.totalPositiveRaw)} earnings offset ${formatCurrency(breakdown.crossPlatformDebtOffset)} of ${formatCurrency(Math.abs(breakdown.totalNegativeRaw))} platform debt`
        : breakdown.platforms.length > 1
          ? "Sum of all platform legs — driver is one entity"
          : undefined;

    steps.push({
      kind: "total",
      prefix: "=",
      label: "Combined net this week",
      amount: breakdown.weekRawNet,
      hint: combinedHint,
    });

    if (breakdown.totalDebtApplied > 0.02) {
      steps.push({
        kind: "deduction",
        prefix: "-",
        label: "Debt applied to older periods",
        amount: -breakdown.totalDebtApplied,
        hint: "Paid from this week's combined earnings toward prior debt",
      });
    }

    steps.push({
      kind: isDebtPayout ? "final-debt" : "final",
      prefix: "=",
      label: "Final net payout",
      amount: breakdown.finalNet,
      hint: breakdown.isReconciled ? "Matches stored driver payout total" : undefined,
    });

    return steps;
  }, [breakdown, isDebtPayout]);

  /** Long operational ladder (gross → platform net) — for accountants; not used in final pay math. */
  const detailedEarningsSteps = useMemo(() => {
    type StepKind = "neutral" | "deduction" | "total" | "final" | "final-debt";
    type StepDef = {
      kind: StepKind;
      prefix?: "-" | "=" | "";
      label: string;
      amount: number;
      hint?: string;
    };
    const steps: StepDef[] = [
      { kind: "neutral", label: "Total gross income (all platforms)", amount: breakdown.totalGross },
      {
        kind: "deduction",
        prefix: "-",
        label: "Total platform fees (Taxa)",
        amount: -breakdown.totalPlatformFees,
      },
    ];
    if (Math.abs(breakdown.totalPlatformNetAdjustment) > 0.02) {
      steps.push({
        kind: "deduction",
        prefix: "-",
        label: "Other platform net adjustments",
        amount: -breakdown.totalPlatformNetAdjustment,
        hint: "Mainly Bolt: net income from export may differ from gross − taxa",
      });
    }
    steps.push(
      {
        kind: "total",
        prefix: "=",
        label: "Total net income (all platforms)",
        amount: breakdown.totalNetIncome,
      },
      {
        kind: "deduction",
        prefix: "-",
        label: "Fleet / subscription (per platform)",
        amount: -breakdown.totalFleetSub,
        hint: "Already shown on each platform card — not deducted twice",
      },
      {
        kind: "total",
        prefix: "=",
        label: "Net after fleet / subscription (before cash)",
        amount: breakdown.netAfterFleetBeforeCash,
      },
      {
        kind: "deduction",
        prefix: "-",
        label: "Cash balance (all platforms)",
        amount: -breakdown.totalCashBalance,
        hint: cashBreakdownHint,
      },
      {
        kind: "total",
        prefix: "=",
        label: "Total net payout of all platforms",
        amount: breakdown.totalNetPayoutAllPlatforms,
        hint: platformNetHint,
      },
      {
        kind: "deduction",
        prefix: "-",
        label: "Custom fee / vehicle rent on all platform payout",
        amount: -breakdown.customFeeVehicleRent,
        hint: "Applied once on combined platform net payout",
      },
    );
    if (Math.abs(breakdown.weeklyChargesDelta) > 0.02) {
      steps.push({
        kind: "deduction",
        prefix: "-",
        label: "Weekly fees & custom charges (→ raw net)",
        amount: breakdown.weeklyChargesDelta,
        hint: "Recurring/custom fees that reduce operational net to the pooled raw net used for payout",
      });
    }
    steps.push({
      kind: "total",
      prefix: "=",
      label: "Pooled raw net (matches final calculation)",
      amount: breakdown.weekRawNet,
    });
    return steps;
  }, [breakdown, cashBreakdownHint, platformNetHint]);

  const sortedPlatforms = useMemo(
    () =>
      [...breakdown.platforms].sort((a, b) => {
        if (a.isDebtPlatform !== b.isDebtPlatform) return a.isDebtPlatform ? -1 : 1;
        return a.platform.localeCompare(b.platform);
      }),
    [breakdown.platforms],
  );
  const showCrossPlatformOffset =
    breakdown.platforms.length > 1 &&
    (breakdown.crossPlatformDebtOffset > 0.02 || breakdown.debtPlatforms.length > 0);
  const showLegShare = breakdown.platforms.length > 1;

  const statementUrl = `/earnings/reports?driverId=${encodeURIComponent(row.driver_id)}&from=${encodeURIComponent(row.payment_period_start.slice(0, 10))}&to=${encodeURIComponent(row.payment_period_end.slice(0, 10))}`;

  return (
    <div className="fm-payout-detail-page">
      {/* Top driver summary bar */}
      <section
        className={`fm-payout-detail-summary${isDebtPayout ? " fm-payout-detail-summary--debt" : ""}`}
      >
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
              Account ID: {row.driver_id.length > 10 ? `${row.driver_id.slice(0, 8)}…` : row.driver_id}
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

        <div
          className={`fm-payout-detail-summary__block fm-payout-detail-summary__amount${isDebtPayout ? " fm-payout-detail-summary__amount--debt" : ""}`}
        >
          <p className="fm-payout-detail-summary__label">Final net payout</p>
          <p className="fm-payout-detail-summary__value tabular-nums">{formatCurrency(breakdown.finalNet)}</p>
        </div>

        <div className="fm-payout-detail-summary__block fm-payout-detail-summary__actions">
          {row.can_pay && onPay ? (
            <button type="button" disabled={isPaying} className="fm-payout-pay-btn !px-5 !py-2.5 !text-sm" onClick={onPay}>
              {isPaying ? "Paying…" : "Pay now"}
            </button>
          ) : (
            <span className="text-xs font-semibold text-rose-700">Not payable</span>
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
        {sortedPlatforms.map((line) => {
          const title =
            line.platform.toLowerCase() === "uber"
              ? "Uber Earnings"
              : line.platform.toLowerCase().includes("bolt")
                ? "Bolt Earnings"
                : `${earningsPlatformLabel(line.platform)} Earnings`;
          return (
            <article
              key={line.payoutId}
              className={`fm-payout-detail-platform-card${line.isDebtPlatform ? " fm-payout-detail-platform-card--debt" : ""}`}
            >
              <div className="fm-payout-detail-platform-card__head">
                <div className="flex items-center gap-2.5 min-w-0">
                  <PlatformLogo platform={line.platform} />
                  <h2 className="text-base font-semibold text-ink">{title}</h2>
                  {line.isDebtPlatform && (
                    <span className="fm-payout-detail-debt-badge">Platform debt</span>
                  )}
                </div>
                <span className="fm-payout-detail-id-badge">ID: {platformShortId(line.platform, line.payoutId)}</span>
              </div>
              <div className="fm-payout-detail-platform-card__body">
                <LineRow label="Base income" value={formatCurrency(line.baseIncome)} />
                <LineRow label="Tips" value={formatCurrency(line.tips)} />
                <LineRow label="Gross (Income + Tips)" value={formatCurrency(line.gross)} bold />
                <LineRow label="Platform fees (Taxa)" value={formatCurrency(-line.platformFees)} variant="deduction" />
                {Math.abs(line.platformNetAdjustment) > 0.02 && (
                  <LineRow
                    label={platformAdjustmentLabel(line.platform)}
                    value={formatCurrency(-line.platformNetAdjustment)}
                    variant="deduction"
                    hint={platformAdjustmentHint(line.platform)}
                  />
                )}
                <LineRow label="Net income" value={formatCurrency(line.netIncome)} bold />
                <LineRow label="Fleet / Subscription" value={formatCurrency(-line.fleetSub)} variant="deduction" />
                <LineRow label="Cash balance (deducted)" value={formatCurrency(-line.cashBalance)} variant="deduction" />
                {line.accountOpeningFee > 0 && (
                  <LineRow label="Account opening fee" value={formatCurrency(-line.accountOpeningFee)} variant="deduction" />
                )}
                <div className={`fm-payout-detail-platform-net${line.isDebtPlatform ? " fm-payout-detail-platform-net--debt" : ""}`}>
                  <span>Operational net ({earningsPlatformLabel(line.platform)})</span>
                  <span className="tabular-nums">{formatCurrency(line.netPayoutFromPlatform)}</span>
                </div>
                <LineRow
                  label="Raw net (this platform)"
                  value={formatCurrency(line.rawNet)}
                  variant={line.isDebtPlatform ? "deduction" : "neutral"}
                  bold
                />
                {Math.abs(line.rawNet - line.netPayoutFromPlatform) > 0.02 && (
                  <LineRow
                    label="Weekly fees & charges"
                    value={formatCurrency(line.rawNet - line.netPayoutFromPlatform)}
                    variant="deduction"
                    hint="Recurring/custom fees on this platform leg"
                  />
                )}
                {showLegShare && (
                  <LineRow
                    label="This leg's share of final payout"
                    value={formatCurrency(line.storedNetDriverPayout)}
                    variant={line.storedNetDriverPayout < -0.02 ? "deduction" : line.storedNetDriverPayout > 0.02 ? "positive" : "neutral"}
                    bold
                    hint="After cross-platform pooling for the driver week"
                  />
                )}
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

      {showCrossPlatformOffset && (
        <section className="fm-payout-detail-offset-band" aria-label="Cross-platform debt offset">
          <div className="fm-payout-detail-offset-band__head">
            <h2 className="text-base font-bold text-violet-950">Cross-platform debt offset</h2>
            <p className="fm-payout-detail-offset-formula mt-1 tabular-nums">
              {formatCurrency(breakdown.totalPositiveRaw)} + ({formatCurrency(breakdown.totalNegativeRaw)}) ={" "}
              <span className={breakdown.weekRawNet < -0.02 ? "text-rose-800 font-bold" : "text-emerald-900 font-bold"}>
                {formatCurrency(breakdown.weekRawNet)}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Positive earnings from one platform reduce debt on another — the driver is one entity.
            </p>
          </div>
          <div className="fm-payout-detail-offset-band__grid">
            <div className="fm-payout-detail-offset-band__cell fm-payout-detail-offset-band__cell--positive">
              <p className="fm-payout-detail-meta-label">Earnings (positive platforms)</p>
              <p className="text-xl font-bold tabular-nums text-emerald-900">{formatCurrency(breakdown.totalPositiveRaw)}</p>
            </div>
            <div className="fm-payout-detail-offset-band__cell fm-payout-detail-offset-band__cell--debt">
              <p className="fm-payout-detail-meta-label">Platform debt</p>
              <p className="text-xl font-bold tabular-nums text-rose-800">{formatCurrency(breakdown.totalNegativeRaw)}</p>
              {breakdown.debtPlatforms.length > 0 && (
                <p className="mt-1 text-[11px] font-medium text-rose-700/90">
                  {breakdown.debtPlatforms.map((p) => earningsPlatformLabel(p)).join(", ")}
                </p>
              )}
            </div>
            <div className="fm-payout-detail-offset-band__cell fm-payout-detail-offset-band__cell--offset">
              <p className="fm-payout-detail-meta-label">Offset applied</p>
              <p className="text-xl font-bold tabular-nums text-rose-800">{formatCurrency(-breakdown.crossPlatformDebtOffset)}</p>
            </div>
            <div className="fm-payout-detail-offset-band__cell fm-payout-detail-offset-band__cell--final">
              <p className="fm-payout-detail-meta-label">Net after offset</p>
              <p className={`text-2xl font-bold tabular-nums ${breakdown.weekRawNet < -0.02 ? "text-rose-950" : "text-emerald-950"}`}>
                {formatCurrency(breakdown.weekRawNet)}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Combined summary + Final payout */}
      <div className="fm-payout-detail-main-grid">
        <section className="fm-payout-detail-combined">
          <div className="fm-payout-detail-combined__head">
            <svg className="h-5 w-5 shrink-0 text-violet-600/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div className="min-w-0">
              <h2 className="fm-payout-detail-combined__title">Final payout calculation</h2>
              <p className="mt-0.5 text-xs text-slate-500">How this week&apos;s platforms combine into one payable amount.</p>
            </div>
          </div>
          <div className="fm-payout-detail-combined__body">
            {finalPayoutSteps.map((step, index) => (
              <SummaryStep
                key={step.label}
                step={index + 1}
                kind={step.kind}
                prefix={step.prefix}
                label={step.label}
                value={formatCurrency(step.amount)}
                hint={step.hint}
              />
            ))}
          </div>
          {isDebtPayout && (
            <div className="fm-payout-detail-not-payable-banner" role="status">
              <svg className="h-5 w-5 shrink-0 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p>
                <strong>No payment will be made.</strong> Driver still owes{" "}
                {formatCurrency(Math.abs(breakdown.finalNet))}.
              </p>
            </div>
          )}
          <details className="fm-payout-detail-earnings-details mt-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-slate-700 hover:text-ink">
              Detailed earnings breakdown (gross → platform net)
            </summary>
            <div className="fm-payout-detail-combined__body border-t border-slate-200/60 px-1 pb-3">
              {detailedEarningsSteps.map((step, index) => (
                <SummaryStep
                  key={`detail-${step.label}`}
                  step={index + 1}
                  kind={step.kind === "final" || step.kind === "final-debt" ? "total" : step.kind}
                  prefix={step.prefix}
                  label={step.label}
                  value={formatCurrency(step.amount)}
                  hint={step.hint}
                />
              ))}
            </div>
          </details>
        </section>

        <section
          className={`fm-payout-detail-final-panel${isDebtPayout ? " fm-payout-detail-final-panel--debt" : ""}`}
        >
          <div className="fm-payout-detail-final-panel__head">
            <div className="flex items-center gap-2">
              <svg
                className={`h-5 w-5 ${isDebtPayout ? "text-rose-700/70" : "text-emerald-700/70"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h2 className={`text-base font-bold ${isDebtPayout ? "text-rose-950" : "text-emerald-950"}`}>
                Final Payout
              </h2>
            </div>
          </div>

          <div className="fm-payout-detail-final-panel__hero">
            <div>
              <p className={`text-sm font-semibold ${isDebtPayout ? "text-rose-900" : "text-emerald-900"}`}>
                Final net payout
              </p>
              <p className="text-xs text-slate-600">
                {isDebtPayout ? "Net balance owed by driver" : "Amount to be paid to driver"}
              </p>
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
              <div className="fm-payout-detail-pay-disabled flex-1">Payment not available</div>
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

          <div className="fm-payout-detail-info-note">
            <p className="fm-payout-detail-info-note__title">Important note</p>
            <p className="fm-payout-detail-info-note__text">
              Fleet commission is deducted per platform on net income. Individual platform net payouts are
              combined, then custom fee / vehicle rent is applied once on the total. Final payout is the stored
              payable amount — there is no separate income tax on top of fleet commission.
            </p>
          </div>
        </section>
      </div>

      {/* Bottom supporting cards */}
      <div className="fm-payout-detail-bottom-grid">
        <article className="fm-payout-detail-mini-card">
          <MiniCardHeading
            title="Debt"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2" />
              </svg>
            }
          />
          <LineRow label="Debt applied" value={formatCurrency(debtApplied)} />
          <LineRow label="Remaining debt" value={formatCurrency(remainingDebt)} variant={remainingDebt > 0 ? "deduction" : "neutral"} />
          <LineRow label="Status" value={statusLabel} />
          {row.consolidated_status === "paid" && row.paid_at && (
            <LineRow label="Paid on" value={row.paid_at.slice(0, 10)} />
          )}
        </article>

        <article className="fm-payout-detail-mini-card">
          <MiniCardHeading
            title="Vehicle"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
          />
          <LineRow label="Assigned" value={vehicleDetail?.has_vehicle_assigned ? "Yes" : "No"} />
          <LineRow label="Plate" value={vehicleDetail?.license_plate ?? "—"} />
          <LineRow label="Weekly rent" value={weeklyRent > 0 ? formatCurrency(weeklyRent) : "—"} />
          {breakdown.customFeeVehicleRent > 0 && (
            <p className="mt-2 text-xs font-medium text-emerald-700">
              Vehicle rent included after combined platform net payout
            </p>
          )}
        </article>

        <article className="fm-payout-detail-mini-card">
          <MiniCardHeading
            title="Reference"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <p className="fm-payout-detail-meta-label">Payout ID</p>
          <p className="font-mono text-[11px] text-ink break-all">{breakdown.payoutId}</p>
        </article>

        <article className="fm-payout-detail-mini-card">
          <MiniCardHeading
            title="Quick actions"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
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
