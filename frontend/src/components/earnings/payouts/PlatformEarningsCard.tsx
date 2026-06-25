import type { PlatformBreakdownLine } from "./payoutBreakdownUtils";
import {
  feeItemsTotalAbs,
  formatFeeStepHint,
  formatFeeStepLabel,
  type FeeDisplayItem,
  type FeeLadderStepDef,
} from "./payoutFeeBreakdown";
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
  feeItems?: FeeDisplayItem[];
  feeAnchorHint?: string;
  feesLoading?: boolean;
  vehicleRentSteps?: FeeLadderStepDef[];
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

function VehicleRentLineRows({ steps }: { steps?: FeeLadderStepDef[] }) {
  if (!steps?.length) return null;
  return (
    <>
      {steps.map((step) => (
        <LineRow
          key={step.label}
          label={step.label}
          value={formatCurrency(step.amount)}
          variant="deduction"
          hint={step.hint}
        />
      ))}
    </>
  );
}

function FeeLineRows({
  line,
  feeItems,
  feeAnchorHint,
  feesLoading,
  vehicleRentSteps,
}: {
  line: PlatformBreakdownLine;
  feeItems?: FeeDisplayItem[];
  feeAnchorHint?: string;
  feesLoading?: boolean;
  vehicleRentSteps?: FeeLadderStepDef[];
}) {
  const weeklyFeesDelta = line.rawNet - line.netPayoutFromPlatform;

  if (feesLoading) {
    return (
      <>
        <LineRow label="Fleet fees" value="…" hint="Loading fee breakdown…" />
        <VehicleRentLineRows steps={vehicleRentSteps} />
      </>
    );
  }

  if (feeItems && feeItems.length > 0) {
    return (
      <>
        {feeItems.map((item) => {
          const isPositive = item.signedAmount > 0.02;
          return (
            <LineRow
              key={item.id}
              label={formatFeeStepLabel(item)}
              value={formatCurrency(item.signedAmount)}
              variant={isPositive ? "positive" : "deduction"}
              hint={formatFeeStepHint(item)}
            />
          );
        })}
        <VehicleRentLineRows steps={vehicleRentSteps} />
      </>
    );
  }

  if (feeAnchorHint) {
    return (
      <>
        <LineRow label="Recurring fees" value="—" hint={feeAnchorHint} />
        <VehicleRentLineRows steps={vehicleRentSteps} />
      </>
    );
  }

  if (Math.abs(weeklyFeesDelta) > 0.02) {
    return (
      <>
        <LineRow
          label="Fleet fees & adjustments"
          value={formatCurrency(weeklyFeesDelta)}
          variant="deduction"
          hint="Recurring/custom fees on this platform leg"
        />
        <VehicleRentLineRows steps={vehicleRentSteps} />
      </>
    );
  }

  return <VehicleRentLineRows steps={vehicleRentSteps} />;
}

function PlatformCalculationStrip({
  line,
  feeItems,
  feesLoading,
  vehicleRentSteps,
}: {
  line: PlatformBreakdownLine;
  feeItems?: FeeDisplayItem[];
  feesLoading?: boolean;
  vehicleRentSteps?: FeeLadderStepDef[];
}) {
  const weeklyFees = Math.abs(line.rawNet - line.netPayoutFromPlatform);
  const fleetFeesTotal = feeItems && feeItems.length > 0 ? feeItemsTotalAbs(feeItems) : weeklyFees;
  const rentTotal = vehicleRentSteps?.reduce((s, step) => s + Math.abs(step.amount), 0) ?? 0;
  const hasFleetFees = feesLoading || fleetFeesTotal > 0.02;
  const hasRent = rentTotal > 0.02;
  const hasDeductionsAfterPlatform = hasFleetFees || hasRent;
  const fleetFeesLabel =
    feeItems && feeItems.length > 1
      ? `Fleet fees (${feeItems.length})`
      : feeItems?.length === 1
        ? formatFeeStepLabel(feeItems[0]!)
        : "Fleet fees";

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
        {hasDeductionsAfterPlatform && (
          <>
            {hasFleetFees && (
              <>
                <span className="fm-payout-detail-calc-strip__op">−</span>
                <span className="fm-payout-detail-calc-strip__item">
                  <span className="fm-payout-detail-calc-strip__label">{fleetFeesLabel}</span>
                  <span className="fm-payout-detail-calc-strip__value tabular-nums text-rose-700">
                    {feesLoading ? "…" : formatCurrency(fleetFeesTotal)}
                  </span>
                </span>
              </>
            )}
            {hasRent && (
              <>
                <span className="fm-payout-detail-calc-strip__op">−</span>
                <span className="fm-payout-detail-calc-strip__item">
                  <span className="fm-payout-detail-calc-strip__label">
                    {vehicleRentSteps!.length > 1
                      ? `Vehicle rent (${vehicleRentSteps!.length})`
                      : (vehicleRentSteps![0]?.label ?? "Vehicle rent")}
                  </span>
                  <span className="fm-payout-detail-calc-strip__value tabular-nums text-rose-700">
                    {formatCurrency(rentTotal)}
                  </span>
                </span>
              </>
            )}
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

function WideRightColumn({
  line,
  showNetPayoutRow,
  feeItems,
  feeAnchorHint,
  feesLoading,
  vehicleRentSteps,
}: {
  line: PlatformBreakdownLine;
  showNetPayoutRow: boolean;
  feeItems?: FeeDisplayItem[];
  feeAnchorHint?: string;
  feesLoading?: boolean;
  vehicleRentSteps?: FeeLadderStepDef[];
}) {
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
      <FeeLineRows
        line={line}
        feeItems={feeItems}
        feeAnchorHint={feeAnchorHint}
        feesLoading={feesLoading}
        vehicleRentSteps={vehicleRentSteps}
      />
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
  feeItems,
  feeAnchorHint,
  feesLoading,
  vehicleRentSteps,
}: {
  line: PlatformBreakdownLine;
  showLegShare: boolean;
  showNetPayoutRow: boolean;
  feeItems?: FeeDisplayItem[];
  feeAnchorHint?: string;
  feesLoading?: boolean;
  vehicleRentSteps?: FeeLadderStepDef[];
}) {
  const platformLabel = earningsPlatformLabel(line.platform);

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
      <FeeLineRows
        line={line}
        feeItems={feeItems}
        feeAnchorHint={feeAnchorHint}
        feesLoading={feesLoading}
        vehicleRentSteps={vehicleRentSteps}
      />
      <LineRow
        label="Raw net (this platform)"
        value={formatCurrency(line.rawNet)}
        variant={line.isDebtPlatform ? "deduction" : "neutral"}
        bold
      />
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
  feeItems,
  feeAnchorHint,
  feesLoading,
  vehicleRentSteps,
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
              <WideRightColumn
                line={line}
                showNetPayoutRow={showNetPayoutRow}
                feeItems={feeItems}
                feeAnchorHint={feeAnchorHint}
                feesLoading={feesLoading}
                vehicleRentSteps={vehicleRentSteps}
              />
              <CommissionBox line={line} />
            </div>
          </div>
          <PlatformCalculationStrip
            line={line}
            feeItems={feeItems}
            feesLoading={feesLoading}
            vehicleRentSteps={vehicleRentSteps}
          />
        </>
      ) : (
        <>
          <div className="fm-payout-detail-platform-card__body">
            <CompactBody
              line={line}
              showLegShare={showLegShare}
              showNetPayoutRow={showNetPayoutRow}
              feeItems={feeItems}
              feeAnchorHint={feeAnchorHint}
              feesLoading={feesLoading}
              vehicleRentSteps={vehicleRentSteps}
            />
          </div>
          <CommissionBox line={line} />
        </>
      )}
    </article>
  );
}
