import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  return (
    <div className="fm-payout-detail-commission-box">
      <p className="fm-payout-detail-commission-box__title">{t("pages.earningsPayouts.detail.commissionAfterFee")}</p>
      <LineRow label={t("pages.earningsPayouts.detail.base")} value={formatCurrency(line.commissionBase)} />
      <LineRow label={t("pages.earningsPayouts.detail.rate")} value={formatRatePctFromFraction(line.commissionRate)} />
      <LineRow label={t("pages.earningsPayouts.detail.commissionCharged")} value={formatCurrency(line.commissionCharged)} bold />
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
  const { t } = useTranslation();
  const weeklyFeesDelta = line.rawNet - line.netPayoutFromPlatform;

  if (feesLoading) {
    return (
      <>
        <LineRow label={t("pages.earningsPayouts.detail.fleetFees")} value="…" hint={t("pages.earningsPayouts.detail.loadingFeeBreakdown")} />
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
        <LineRow label={t("pages.earningsPayouts.detail.recurringFees")} value="—" hint={feeAnchorHint} />
        <VehicleRentLineRows steps={vehicleRentSteps} />
      </>
    );
  }

  if (Math.abs(weeklyFeesDelta) > 0.02) {
    return (
      <>
        <LineRow
          label={t("pages.earningsPayouts.detail.fleetFeesAndAdjustments")}
          value={formatCurrency(weeklyFeesDelta)}
          variant="deduction"
          hint={t("pages.earningsPayouts.detail.recurringCustomFeesLegHint")}
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
  const { t } = useTranslation();
  const weeklyFees = Math.abs(line.rawNet - line.netPayoutFromPlatform);
  const fleetFeesTotal = feeItems && feeItems.length > 0 ? feeItemsTotalAbs(feeItems) : weeklyFees;
  const rentTotal = vehicleRentSteps?.reduce((s, step) => s + Math.abs(step.amount), 0) ?? 0;
  const hasFleetFees = feesLoading || fleetFeesTotal > 0.02;
  const hasRent = rentTotal > 0.02;
  const hasDeductionsAfterPlatform = hasFleetFees || hasRent;
  const fleetFeesLabel =
    feeItems && feeItems.length > 1
      ? t("pages.earningsPayouts.detail.fleetFeesCount", { count: feeItems.length })
      : feeItems?.length === 1
        ? formatFeeStepLabel(feeItems[0]!)
        : t("pages.earningsPayouts.detail.fleetFees");

  return (
    <div className="fm-payout-detail-calc-strip" aria-label={t("pages.earningsPayouts.detail.platformCalcSummaryAriaLabel")}>
      <div className="fm-payout-detail-calc-strip__flow">
        <span className="fm-payout-detail-calc-strip__item">
          <span className="fm-payout-detail-calc-strip__label">{t("pages.earningsPayouts.detail.netIncome")}</span>
          <span className="fm-payout-detail-calc-strip__value tabular-nums">{formatCurrency(line.netIncome)}</span>
        </span>
        <span className="fm-payout-detail-calc-strip__op">−</span>
        <span className="fm-payout-detail-calc-strip__item">
          <span className="fm-payout-detail-calc-strip__label">{t("pages.earningsPayouts.detail.fleetSubscription")}</span>
          <span className="fm-payout-detail-calc-strip__value tabular-nums text-rose-700">
            {formatCurrency(line.fleetSub)}
          </span>
        </span>
        <span className="fm-payout-detail-calc-strip__op">−</span>
        <span className="fm-payout-detail-calc-strip__item">
          <span className="fm-payout-detail-calc-strip__label">{t("pages.earningsPayouts.detail.cashBalance")}</span>
          <span className="fm-payout-detail-calc-strip__value tabular-nums text-rose-700">
            {formatCurrency(line.cashBalance)}
          </span>
        </span>
        <span className="fm-payout-detail-calc-strip__op">=</span>
        <span className="fm-payout-detail-calc-strip__item fm-payout-detail-calc-strip__item--highlight">
          <span className="fm-payout-detail-calc-strip__label">{t("pages.earningsPayouts.detail.netAfterPlatformDeductions")}</span>
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
                      ? t("pages.earningsPayouts.detail.vehicleRentCount", { count: vehicleRentSteps!.length })
                      : (vehicleRentSteps![0]?.label ?? t("pages.earningsPayouts.detail.vehicleRent"))}
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
          <span className="fm-payout-detail-calc-strip__label">{t("pages.earningsPayouts.detail.finalPlatformPayout")}</span>
          <span className="fm-payout-detail-calc-strip__value tabular-nums">
            {formatCurrency(line.storedNetDriverPayout)}
          </span>
        </span>
      </div>
    </div>
  );
}

function EarningsLeftColumn({ line }: { line: PlatformBreakdownLine }) {
  const { t } = useTranslation();
  return (
    <>
      <LineRow label={t("pages.earningsPayouts.detail.baseIncome")} value={formatCurrency(line.baseIncome)} />
      <LineRow label={t("pages.earningsPayouts.detail.tips")} value={formatCurrency(line.tips)} />
      <LineRow label={t("pages.earningsPayouts.detail.grossIncomeTips")} value={formatCurrency(line.gross)} bold />
      <LineRow label={t("pages.earningsPayouts.detail.platformFeesTaxa")} value={formatCurrency(-line.platformFees)} variant="deduction" />
      {Math.abs(line.platformNetAdjustment) > 0.02 && (
        <LineRow
          label={platformAdjustmentLabel(line.platform)}
          value={formatCurrency(-line.platformNetAdjustment)}
          variant="deduction"
          hint={platformAdjustmentHint(line.platform)}
        />
      )}
      <LineRow label={t("pages.earningsPayouts.detail.netIncome")} value={formatCurrency(line.netIncome)} bold />
      <LineRow label={t("pages.earningsPayouts.detail.fleetSubscription")} value={formatCurrency(-line.fleetSub)} variant="deduction" />
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
  const { t } = useTranslation();
  return (
    <>
      <LineRow label={t("pages.earningsPayouts.detail.cashBalanceDeducted")} value={formatCurrency(-line.cashBalance)} variant="deduction" />
      {line.accountOpeningFee > 0 && (
        <LineRow label={t("pages.earningsPayouts.detail.accountOpeningFee")} value={formatCurrency(-line.accountOpeningFee)} variant="deduction" />
      )}
      <div className="fm-payout-detail-platform-net fm-payout-detail-platform-net--highlight">
        <span>{t("pages.earningsPayouts.detail.netAfterPlatformDeductions")}</span>
        <span className="tabular-nums">{formatCurrency(line.netPayoutFromPlatform)}</span>
      </div>
      <LineRow
        label={t("pages.earningsPayouts.detail.platformBalanceBeforeFinalFees")}
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
          <span>{t("pages.earningsPayouts.detail.finalPlatformPayout")}</span>
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
  const { t } = useTranslation();
  const platformLabel = earningsPlatformLabel(line.platform);

  return (
    <>
      <EarningsLeftColumn line={line} />
      <LineRow label={t("pages.earningsPayouts.detail.cashBalanceParenDeducted")} value={formatCurrency(-line.cashBalance)} variant="deduction" />
      {line.accountOpeningFee > 0 && (
        <LineRow label={t("pages.earningsPayouts.detail.accountOpeningFee")} value={formatCurrency(-line.accountOpeningFee)} variant="deduction" />
      )}
      <div className={`fm-payout-detail-platform-net${line.isDebtPlatform ? " fm-payout-detail-platform-net--debt" : ""}`}>
        <span>{t("pages.earningsPayouts.detail.operationalNet", { platform: platformLabel })}</span>
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
        label={t("pages.earningsPayouts.detail.rawNetThisPlatform")}
        value={formatCurrency(line.rawNet)}
        variant={line.isDebtPlatform ? "deduction" : "neutral"}
        bold
      />
      {showNetPayoutRow && (
        <div className="fm-payout-detail-platform-net fm-payout-detail-platform-net--highlight">
          <span>{t("pages.earningsPayouts.detail.netPayoutFrom", { platform: platformLabel })}</span>
          <span className="tabular-nums">{formatCurrency(line.storedNetDriverPayout)}</span>
        </div>
      )}
      {showLegShare && (
        <LineRow
          label={t("pages.earningsPayouts.detail.legShareOfFinalPayout")}
          value={formatCurrency(line.storedNetDriverPayout)}
          variant={
            line.storedNetDriverPayout < -0.02
              ? "deduction"
              : line.storedNetDriverPayout > 0.02
                ? "positive"
                : "neutral"
          }
          bold
          hint={t("pages.earningsPayouts.detail.crossPlatformPoolingHint")}
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
  const { t } = useTranslation();
  const isWide = layout === "wide";

  return (
    <article
      className={`fm-payout-detail-platform-card${line.isDebtPlatform ? " fm-payout-detail-platform-card--debt" : ""}${isWide ? " fm-payout-detail-platform-card--wide" : ""}`}
    >
      <div className="fm-payout-detail-platform-card__head">
        <div className="flex min-w-0 items-center gap-2.5">
          <PlatformLogo platform={line.platform} />
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {line.isDebtPlatform && <span className="fm-payout-detail-debt-badge">{t("pages.earningsPayouts.detail.platformDebtLabel")}</span>}
        </div>
        <span className="fm-payout-detail-id-badge">{t("pages.earningsPayouts.detail.idBadge", { id: platformShortId(line.platform, line.payoutId) })}</span>
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
