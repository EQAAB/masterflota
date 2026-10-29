import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ConsolidatedDriverPayout, PayoutListItem } from "../../../api/earnings";
import type { WeekLoanRepayment } from "../../../api/driverLoans";
import { FleetManagerLogoMark } from "../../brand/FleetManagerLogoMark";
import { getAppBranding } from "../../../lib/appBranding";
import { formatCurrency } from "../../../utils/currency";
import { computeUnifiedBreakdown, formatPeriodParts } from "./payoutBreakdownUtils";
import type { WeekFeeBreakdown } from "./payoutFeeBreakdown";
import { BoltPlatformLogo, GlovoPlatformLogo, UberPlatformLogo, WoltPlatformLogo } from "../../drivers/platformLogos";
import { buildCourierStatementModel, statementPlatformSummary } from "./courierStatementModel";

type CourierPayoutStatementProps = {
  row: ConsolidatedDriverPayout;
  payoutItems: PayoutListItem[];
  weekFeeBreakdown?: WeekFeeBreakdown;
  loanRepayments?: WeekLoanRepayment[];
};

function formatStatementDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

function StatementPlatformMark({ platform }: { platform: string }) {
  const code = platform.toLowerCase();
  if (code === "uber") return <UberPlatformLogo className="!h-6 !w-6 !rounded-md !shadow-none" />;
  if (code === "bolt" || code === "bolt_taxi" || code === "bolt_courier") {
    return <BoltPlatformLogo className="!h-6 !w-6 !rounded-md !shadow-none" />;
  }
  if (code === "wolt" || code === "wolt_courier") {
    return <WoltPlatformLogo className="!h-6 !w-6 !rounded-md !shadow-none" />;
  }
  if (code === "glovo") return <GlovoPlatformLogo className="!h-6 !w-6 !rounded-md !shadow-none" />;
  return <span className="payout-statement__mark" aria-hidden />;
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

  const period = formatPeriodParts(row.payment_period_start, row.payment_period_end);
  const weekLabel = period
    ? `${period.range} ${period.year}`
    : `${row.payment_period_start.slice(0, 10)} – ${row.payment_period_end.slice(0, 10)}`;
  const driverName = `${row.first_name} ${row.last_name}`.trim();
  const platformLabel = statementPlatformSummary(row, model.platforms);
  const payable = model.finalNet >= -0.02;
  const status = t(`pages.earningsPayouts.payoutStatusShort.${row.consolidated_status}`, {
    defaultValue: row.consolidated_status.replace(/_/g, " "),
  });

  return (
    <article className="payout-statement">
      <header className="payout-statement__header">
        <div>
          <div className="payout-statement__brand">
            <FleetManagerLogoMark className="h-10 w-10" title={brand.appName} monogram={brand.logoMonogram} />
            <div>
              <p className="payout-statement__brand-name">{brand.appName}</p>
              <p className="payout-statement__brand-role">{t("pages.earningsPayouts.statement.partnerRole")}</p>
            </div>
          </div>
          <h1 className="payout-statement__title">{t("pages.earningsPayouts.statement.title")}</h1>
          <p className="payout-statement__week">
            {t("pages.earningsPayouts.statement.week", { week: weekLabel })}
          </p>
        </div>
        <dl className="payout-statement__meta">
          <div>
            <dt>{t("pages.earningsPayouts.statement.courier")}</dt>
            <dd>{driverName}</dd>
          </div>
          <div>
            <dt>{t("pages.earningsPayouts.statement.courierId")}</dt>
            <dd>{model.courierIds.length ? model.courierIds.join(", ") : "—"}</dd>
          </div>
          <div>
            <dt>{t("pages.earningsPayouts.statement.platform")}</dt>
            <dd className="payout-statement__platform">
              {!model.multiPlatform && model.platforms[0] ? (
                <StatementPlatformMark platform={model.platforms[0].platform} />
              ) : null}
              <span>{platformLabel}</span>
            </dd>
          </div>
          <div>
            <dt>{t("common.status")}</dt>
            <dd>{status}</dd>
          </div>
        </dl>
      </header>

      {model.multiPlatform && (
        <section className="payout-statement__platforms" aria-label={t("pages.earningsPayouts.statement.byPlatform")}>
          <p className="payout-statement__section-label">{t("pages.earningsPayouts.statement.byPlatform")}</p>
          <ul>
            {model.platforms.map((p) => (
              <li key={p.platform}>
                <span className="payout-statement__platform">
                  <StatementPlatformMark platform={p.platform} />
                  {p.label}
                </span>
                <span className="tabular-nums">{formatCurrency(p.netIncome)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
              <td>
                <span className="payout-statement__line">
                  <span className={`payout-statement__mark is-${line.kind}`} aria-hidden />
                  {line.label}
                </span>
              </td>
              <td className={line.kind === "deduction" ? "is-deduction" : "is-income"}>
                {formatCurrency(line.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={`payout-statement__final${payable ? "" : " is-debt"}`}>
        <span>{t("pages.earningsPayouts.statement.finalAmount")}</span>
        <strong className="tabular-nums">{formatCurrency(model.finalNet)}</strong>
      </div>

      <footer className="payout-statement__footer">
        <div>
          <p>
            {t("pages.earningsPayouts.statement.date", {
              date: formatStatementDate(row.payment_period_end),
            })}
          </p>
          <p>
            {t("pages.earningsPayouts.statement.generatedBy", { name: brand.appName })}
          </p>
        </div>
        <div className="payout-statement__thanks">
          <p>{t("pages.earningsPayouts.statement.thanks")}</p>
          <p>{t("pages.earningsPayouts.statement.tagline")}</p>
        </div>
      </footer>
    </article>
  );
}
