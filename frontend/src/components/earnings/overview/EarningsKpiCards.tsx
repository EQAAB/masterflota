import { useTranslation } from "react-i18next";
import type { EarningsOverviewResponse } from "../../../api/earnings";
import { KpiStatCard } from "../../dashboard/KpiStatCard";
import { CHART_BRAND, CHART_WARNING } from "../../dashboard/chartPalette";
import { formatCurrency } from "../../../utils/currency";
import { KpiSparkline } from "./KpiSparkline";
import { buildSparklineSeries, pendingOfGrossPct } from "./useEarningsOverviewDerived";

const PURPLE = "#7C3AED";

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-7M16 12h.01"
      />
    </svg>
  );
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
      />
    </svg>
  );
}

function AnalyticsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3 3v18h18M7 16l4-4 4 4 5-6"
      />
    </svg>
  );
}

type EarningsKpiCardsProps = {
  kpis: EarningsOverviewResponse["kpis"];
  monthly: EarningsOverviewResponse["monthly"];
};

export function EarningsKpiCards({ kpis, monthly }: EarningsKpiCardsProps) {
  const { t } = useTranslation();
  const pendingPct = pendingOfGrossPct(kpis);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <KpiStatCard
        title={t("pages.earningsOverview.kpiPendingPayouts")}
        value={formatCurrency(kpis.pendingPaymentsTotal)}
        subtitle={
          pendingPct != null ? t("pages.earningsOverview.kpiPendingPayoutsSub", { pct: pendingPct.toFixed(0) }) : undefined
        }
        icon={<WalletIcon className="h-5 w-5" />}
        iconClassName="bg-success/10 text-success"
        sparkline={
          <KpiSparkline
            data={buildSparklineSeries(monthly, "totalEarnings")}
            color={CHART_BRAND}
          />
        }
      />
      <KpiStatCard
        title={t("pages.earningsOverview.kpiGross30d")}
        value={formatCurrency(kpis.totalEarningsLast30Days)}
        subtitle={t("pages.earningsOverview.kpiGross30dSub")}
        icon={<CurrencyIcon className="h-5 w-5" />}
        iconClassName="bg-purple-100 text-purple-700"
        sparkline={
          <KpiSparkline
            data={buildSparklineSeries(monthly, "totalCommission")}
            color={PURPLE}
            fillColor="#EDE9FE"
          />
        }
      />
      <KpiStatCard
        title={t("pages.earningsOverview.kpiAvgPaidPayout")}
        value={formatCurrency(kpis.avgPayoutPaidLast90Days)}
        subtitle={t("pages.earningsOverview.kpiAvgPaidPayoutSub")}
        icon={<AnalyticsIcon className="h-5 w-5" />}
        iconClassName="bg-warning/10 text-warning"
        sparkline={
          <KpiSparkline
            data={buildSparklineSeries(monthly, "grossDelta")}
            color={CHART_WARNING}
            fillColor="#FEF3C7"
          />
        }
      />
    </div>
  );
}
