import { useTranslation } from "react-i18next";
import type { EarningsOverviewResponse } from "../../../api/earnings";
import { CHART_BRAND } from "../../dashboard/chartPalette";
import { formatCurrency } from "../../../utils/currency";
import { EarningsDonutCard } from "./EarningsDonutCard";
import {
  commissionSharePct,
  estimatedCommission30d,
} from "./useEarningsOverviewDerived";

const GRAY = "#D1D5DB";

type CommissionGrossDonutCardProps = {
  kpis: EarningsOverviewResponse["kpis"];
  monthly: EarningsOverviewResponse["monthly"];
};

export function CommissionGrossDonutCard({ kpis, monthly }: CommissionGrossDonutCardProps) {
  const { t } = useTranslation();
  const gross = kpis.totalEarningsLast30Days;
  const commission = estimatedCommission30d(kpis, monthly);
  const pct = commissionSharePct(commission, gross);

  const segments = [
    {
      name: t("pages.earningsOverview.commissionPctLabel", { pct: pct.toFixed(0) }),
      value: commission,
      color: CHART_BRAND,
      amountLabel: formatCurrency(commission),
    },
    {
      name: t("pages.earningsOverview.grossPctLabel", { pct: (100 - pct).toFixed(0) }),
      value: Math.max(0, gross),
      color: GRAY,
      amountLabel: formatCurrency(gross),
    },
  ];

  return (
    <EarningsDonutCard
      title={t("pages.earningsOverview.commissionVsGrossTitle")}
      centerPct={pct}
      centerLabel={t("pages.earningsOverview.commissionCenterLabel")}
      segments={segments}
      footerNote={
        monthly.length > 0 ? t("pages.earningsOverview.estimatedFromMonthlyRatio") : undefined
      }
      footerAction={{ label: t("pages.earningsOverview.viewCommissionReportLink"), to: "/earnings/reports" }}
    />
  );
}
