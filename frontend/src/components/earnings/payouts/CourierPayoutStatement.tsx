import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ConsolidatedDriverPayout, PayoutListItem } from "../../../api/earnings";
import type { WeekLoanRepayment } from "../../../api/driverLoans";
import { FleetManagerLogoMark } from "../../brand/FleetManagerLogoMark";
import { BoltPlatformLogo, GlovoPlatformLogo, UberPlatformLogo, WoltPlatformLogo } from "../../drivers/platformLogos";
import { getAppBranding } from "../../../lib/appBranding";
import { formatCurrency } from "../../../utils/currency";
import { computeUnifiedBreakdown } from "./payoutBreakdownUtils";
import type { WeekFeeBreakdown } from "./payoutFeeBreakdown";
import { buildCourierStatementModel } from "./courierStatementModel";
import {
  formatStatementDay,
  formatStatementWeek,
  statementDisplayId,
  statementFinalAmountKey,
  statementGeneratedBy,
  statementPayoutDateIso,
  statementSummaryId,
} from "./courierStatementFormat";

type CourierPayoutStatementProps = {
  row: ConsolidatedDriverPayout;
  payoutItems: PayoutListItem[];
  weekFeeBreakdown?: WeekFeeBreakdown;
  loanRepayments?: WeekLoanRepayment[];
};

function StatementPlatformMark({ platform }: { platform: string }) {
  const code = platform.toLowerCase();
  const className = "payout-statement__logo !h-8 !w-8 !rounded-md !shadow-none";
  if (code === "uber") return <UberPlatformLogo className={className} />;
  if (code === "bolt" || code === "bolt_taxi" || code === "bolt_courier") {
    return <BoltPlatformLogo className={className} />;
  }
  if (code === "wolt" || code === "wolt_courier") return <WoltPlatformLogo className={className} />;
  if (code === "glovo") return <GlovoPlatformLogo className={className} />;
  return null;
}

function courierIdsForPlatform(items: PayoutListItem[], platform: string): string {
  const ids = [
    ...new Set(
      items
        .filter((item) => (item.earnings_platform ?? "") === platform)
        .map((item) => item.platform_id?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const visible = ids.map((id) => statementDisplayId(id)).filter((id) => id !== "-");
  return visible.length ? visible.join(", ") : "-";
}

export function CourierPayoutStatement({
  row,
  payoutItems,
  weekFeeBreakdown,
  loanRepayments = [],
}: CourierPayoutStatementProps) {
  const { t } = useTranslation();
  const brand = getAppBranding();
  const breakdown = useMemo(
    () => computeUnifiedBreakdown(row, payoutItems),
    [row, payoutItems],
  );
  const model = useMemo(
    () =>
      buildCourierStatementModel({
        breakdown,
        payoutItems,
        weekFeeBreakdown,
        loanRepayments,
      }),
    [breakdown, payoutItems, weekFeeBreakdown, loanRepayments],
  );

  const driverName = `${row.first_name} ${row.last_name}`.trim() || "-";
  const payable = model.finalNet >= -0.02;
  const headerPlatforms = model.platforms.length
    ? model.platforms
    : row.platforms.map((platform) => ({ platform, label: platform, netIncome: 0 }));

  return (
    <article className="payout-statement">
      <header className="payout-statement__top">
        <div className="payout-statement__brand-row">
          <div className="payout-statement__platforms-logos">
            {headerPlatforms.map((platform) => (
              <span key={platform.platform} className="payout-statement__platform-brand">
                <StatementPlatformMark platform={platform.platform} />
                <span>{platform.label}</span>
              </span>
            ))}
          </div>
          <div className="payout-statement__issuer">
            <FleetManagerLogoMark className="h-9 w-9" title={brand.appName} monogram={brand.logoMonogram} />
            <div>
              <p className="payout-statement__issuer-name">{brand.appName}</p>
              <p className="payout-statement__issuer-role">{t("pages.earningsPayouts.statement.fleetRole")}</p>
            </div>
          </div>
        </div>
        <div className="payout-statement__heading">
          <h1>{t("pages.earningsPayouts.statement.title")}</h1>
          <p>{t("pages.earningsPayouts.statement.subtitle")}</p>
        </div>
      </header>

      <dl className="payout-statement__summary">
        <div>
          <dt>{t("pages.earningsPayouts.statement.courierId")}</dt>
          <dd>{statementSummaryId(model.courierIds, model.multiPlatform)}</dd>
        </div>
        <div>
          <dt>{t("pages.earningsPayouts.statement.courierName")}</dt>
          <dd>{driverName}</dd>
        </div>
        <div>
          <dt>{t("pages.earningsPayouts.statement.weekLabel")}</dt>
          <dd>{formatStatementWeek(row.payment_period_start, row.payment_period_end)}</dd>
        </div>
        <div>
          <dt>{t("pages.earningsPayouts.statement.payoutDate")}</dt>
          <dd>{formatStatementDay(statementPayoutDateIso(row))}</dd>
        </div>
      </dl>

      {model.multiPlatform && (
        <table className="payout-statement__table payout-statement__platforms-table">
          <thead>
            <tr>
              <th>{t("pages.earningsPayouts.statement.platform")}</th>
              <th>{t("pages.earningsPayouts.statement.courierId")}</th>
              <th>{t("pages.earningsPayouts.statement.netIncome")}</th>
            </tr>
          </thead>
          <tbody>
            {model.platforms.map((platform) => (
              <tr key={platform.platform}>
                <td>
                  <span className="payout-statement__platform-brand">
                    <StatementPlatformMark platform={platform.platform} />
                    <span>{platform.label}</span>
                  </span>
                </td>
                <td>{courierIdsForPlatform(payoutItems, platform.platform)}</td>
                <td className="tabular-nums">{formatCurrency(platform.netIncome)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="payout-statement__section-head">
        <span>{t("pages.earningsPayouts.statement.earningsHeading")}</span>
        <span>{t("pages.earningsPayouts.statement.currencyCode")}</span>
      </div>

      <table className="payout-statement__table">
        <thead>
          <tr>
            <th>{t("pages.earningsPayouts.statement.description")}</th>
            <th>{t("pages.earningsPayouts.statement.amount")}</th>
          </tr>
        </thead>
        <tbody>
          {model.lines.map((line) => (
            <tr key={line.key}>
              <td>{line.label}</td>
              <td className="tabular-nums">{formatCurrency(line.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={`payout-statement__final${payable ? "" : " is-debt"}`}>
        <span>{t(statementFinalAmountKey(row.consolidated_status, model.finalNet))}</span>
        <strong className="tabular-nums">{formatCurrency(model.finalNet)}</strong>
      </div>

      <footer className="payout-statement__footer">
        <p className="payout-statement__thanks">{t("pages.earningsPayouts.statement.thanks")}</p>
        <p>{statementGeneratedBy(brand)}</p>
        <p>{t("pages.earningsPayouts.statement.disclaimer")}</p>
      </footer>
    </article>
  );
}
