import type { PlatformBreakdownLine } from "./payoutBreakdownUtils";
import { formatCurrency } from "../../../utils/currency";
import { earningsPlatformLabel } from "../../../utils/earningsPlatformLabel";
import { formatRatePctFromFraction } from "./payoutRowUtils";
import { platformShortId } from "./payoutBreakdownUtils";
import {
  LineRow,
  PlatformLogo,
  platformAdjustmentHint,
  platformAdjustmentLabel,
} from "./payoutDetailUi";

export type PlatformEarningsCardProps = {
  line: PlatformBreakdownLine;
  title: string;
  layout: "wide" | "compact";
  showLegShare: boolean;
  showNetPayoutRow: boolean;
};

function CommissionBox({ line }: { line: PlatformBreakdownLine }) {
  return (
    <div className="fm-payout-detail-commission-box">
      <p className="fm-payout-detail-commission-box__title">Commission after platform fee</p>
      <LineRow label="Base" value={formatCurrency(line.commissionBase)} />
      <LineRow label="Rate" value={formatRatePctFromFraction(line.commissionRate)} />
      <LineRow label="Commission charged" value={formatCurrency(line.commissionCharged)} bold />
    </div>
  );
}

function PlatformCalculationStrip({ line }: { line: PlatformBreakdownLine }) {
  const weeklyFees = Math.abs(line.rawNet - line.netPayoutFromPlatform);
  const hasWeeklyFees = weeklyFees > 0.02;

  return (
    <div className="fm-payout-detail-calc-strip" aria-label="Platform payout calculation summary">
      <div className="fm-payout-detail-calc-strip__flow">
        <span className="fm-payout-detail-calc-strip__item">
          <span className="fm-payout-detail-calc-strip__label">Net income</span>
          <span className="fm-payout-detail-calc-strip__value tabular-nums">{formatCurrency(line.netIncome)}</span>
        </span>
        <span className="fm-payout-detail-calc-strip__op">−</span>
        <span className="fm-payout-detail-calc-strip__item">
          <span className="fm-payout-detail-calc-strip__label">Fleet / Subscription</span>
          <span className="fm-payout-detail-calc-strip__value tabular-nums text-rose-700">
            {formatCurrency(line.fleetSub)}
          </span>
        </span>
        <span className="fm-payout-detail-calc-strip__op">−</span>
        <span className="fm-payout-detail-calc-strip__item">
          <span className="fm-payout-detail-calc-strip__label">Cash balance</span>
          <span className="fm-payout-detail-calc-strip__value tabular-nums text-rose-700">
            {formatCurrency(line.cashBalance)}
          </span>
        </span>
        <span className="fm-payout-detail-calc-strip__op">=</span>
        <span className="fm-payout-detail-calc-strip__item fm-payout-detail-calc-strip__item--highlight">
          <span className="fm-payout-detail-calc-strip__label">Net after platform deductions</span>
          <span className="fm-payout-detail-calc-strip__value tabular-nums">
            {formatCurrency(line.netPayoutFromPlatform)}
          </span>
        </span>
        {hasWeeklyFees && (
          <>
            <span className="fm-payout-detail-calc-strip__op">−</span>
            <span className="fm-payout-detail-calc-strip__item">
              <span className="fm-payout-detail-calc-strip__label">Weekly fees & charges</span>
              <span className="fm-payout-detail-calc-strip__value tabular-nums text-rose-700">
                {formatCurrency(weeklyFees)}
              </span>
            </span>
          </>
        )}
        <span className="fm-payout-detail-calc-strip__op">=</span>
        <span className="fm-payout-detail-calc-strip__item fm-payout-detail-calc-strip__item--final">
          <span className="fm-payout-detail-calc-strip__label">Final platform payout</span>
          <span className="fm-payout-detail-calc-strip__value tabular-nums">
            {formatCurrency(line.storedNetDriverPayout)}
          </span>
        </span>
      </div>
    </div>
  );
}

function EarningsLeftColumn({ line }: { line: PlatformBreakdownLine }) {
  return (
    <>
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
    </>
  );
}

function WideRightColumn({ line, showNetPayoutRow }: { line: PlatformBreakdownLine; showNetPayoutRow: boolean }) {
  const weeklyFeesDelta = line.rawNet - line.netPayoutFromPlatform;

  return (
    <>
      <LineRow label="Cash balance deducted" value={formatCurrency(-line.cashBalance)} variant="deduction" />
      {line.accountOpeningFee > 0 && (
        <LineRow label="Account opening fee" value={formatCurrency(-line.accountOpeningFee)} variant="deduction" />
      )}
      <div className="fm-payout-detail-platform-net fm-payout-detail-platform-net--highlight">
        <span>Net after platform deductions</span>
        <span className="tabular-nums">{formatCurrency(line.netPayoutFromPlatform)}</span>
      </div>
      <LineRow
        label="Platform balance before final fees"
        value={formatCurrency(line.netPayoutFromPlatform)}
        bold
      />
      {Math.abs(weeklyFeesDelta) > 0.02 && (
        <LineRow
          label="Weekly fees & charges"
          value={formatCurrency(weeklyFeesDelta)}
          variant="deduction"
          hint="Recurring/custom fees on this platform leg"
        />
      )}
      {showNetPayoutRow && (
        <div className="fm-payout-detail-platform-net fm-payout-detail-platform-net--highlight">
          <span>Final platform payout</span>
          <span className="tabular-nums">{formatCurrency(line.storedNetDriverPayout)}</span>
        </div>
      )}
    </>
  );
}

function CompactBody({
  line,
  showLegShare,
  showNetPayoutRow,
}: {
  line: PlatformBreakdownLine;
  showLegShare: boolean;
  showNetPayoutRow: boolean;
}) {
  const platformLabel = earningsPlatformLabel(line.platform);
  const weeklyFeesDelta = line.rawNet - line.netPayoutFromPlatform;

  return (
    <>
      <EarningsLeftColumn line={line} />
      <LineRow label="Cash balance (deducted)" value={formatCurrency(-line.cashBalance)} variant="deduction" />
      {line.accountOpeningFee > 0 && (
        <LineRow label="Account opening fee" value={formatCurrency(-line.accountOpeningFee)} variant="deduction" />
      )}
      <div className={`fm-payout-detail-platform-net${line.isDebtPlatform ? " fm-payout-detail-platform-net--debt" : ""}`}>
        <span>Operational net ({platformLabel})</span>
        <span className="tabular-nums">{formatCurrency(line.netPayoutFromPlatform)}</span>
      </div>
      <LineRow
        label="Raw net (this platform)"
        value={formatCurrency(line.rawNet)}
        variant={line.isDebtPlatform ? "deduction" : "neutral"}
        bold
      />
      {Math.abs(weeklyFeesDelta) > 0.02 && (
        <LineRow
          label="Weekly fees & charges"
          value={formatCurrency(weeklyFeesDelta)}
          variant="deduction"
          hint="Recurring/custom fees on this platform leg"
        />
      )}
      {showNetPayoutRow && (
        <div className="fm-payout-detail-platform-net fm-payout-detail-platform-net--highlight">
          <span>Net payout from {platformLabel}</span>
          <span className="tabular-nums">{formatCurrency(line.storedNetDriverPayout)}</span>
        </div>
      )}
      {showLegShare && (
        <LineRow
          label="This leg's share of final payout"
          value={formatCurrency(line.storedNetDriverPayout)}
          variant={
            line.storedNetDriverPayout < -0.02
              ? "deduction"
              : line.storedNetDriverPayout > 0.02
                ? "positive"
                : "neutral"
          }
          bold
          hint="After cross-platform pooling for the driver week"
        />
      )}
    </>
  );
}

export function PlatformEarningsCard({
  line,
  title,
  layout,
  showLegShare,
  showNetPayoutRow,
}: PlatformEarningsCardProps) {
  const isWide = layout === "wide";

  return (
    <article
      className={`fm-payout-detail-platform-card${line.isDebtPlatform ? " fm-payout-detail-platform-card--debt" : ""}${isWide ? " fm-payout-detail-platform-card--wide" : ""}`}
    >
      <div className="fm-payout-detail-platform-card__head">
        <div className="flex min-w-0 items-center gap-2.5">
          <PlatformLogo platform={line.platform} />
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {line.isDebtPlatform && <span className="fm-payout-detail-debt-badge">Platform debt</span>}
        </div>
        <span className="fm-payout-detail-id-badge">ID: {platformShortId(line.platform, line.payoutId)}</span>
      </div>

      {isWide ? (
        <>
          <div className="fm-payout-detail-platform-card__split">
            <div className="fm-payout-detail-platform-card__body fm-payout-detail-platform-card__body--col">
              <EarningsLeftColumn line={line} />
            </div>
            <div className="fm-payout-detail-platform-card__body fm-payout-detail-platform-card__body--col">
              <WideRightColumn line={line} showNetPayoutRow={showNetPayoutRow} />
              <CommissionBox line={line} />
            </div>
          </div>
          <PlatformCalculationStrip line={line} />
        </>
      ) : (
        <>
          <div className="fm-payout-detail-platform-card__body">
            <CompactBody line={line} showLegShare={showLegShare} showNetPayoutRow={showNetPayoutRow} />
          </div>
          <CommissionBox line={line} />
        </>
      )}
    </article>
  );
}
