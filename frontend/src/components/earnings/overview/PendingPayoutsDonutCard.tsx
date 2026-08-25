import { useTranslation } from "react-i18next";
import type { EarningsOverviewResponse } from "../../../api/earnings";
import { CHART_WARNING } from "../../dashboard/chartPalette";
import { formatCurrency } from "../../../utils/currency";
import { EarningsDonutCard } from "./EarningsDonutCard";
import { pendingSharePct } from "./useEarningsOverviewDerived";

const GRAY = "#D1D5DB";

type PendingPayoutsDonutCardProps = {
  kpis: EarningsOverviewResponse["kpis"];
};

export function PendingPayoutsDonutCard({ kpis }: PendingPayoutsDonutCardProps) {
  const { t } = useTranslation();
  const pending = kpis.pendingPaymentsTotal;
  const remainder = Math.max(0, kpis.totalEarningsLast30Days - pending);
  const pct = pendingSharePct(kpis);
  const remainderPct = 100 - pct;

  const segments = [
    {
      name: t("pages.earningsOverview.pendingPayoutsPctLabel", { pct: pct.toFixed(0) }),
      value: pending,
      color: CHART_WARNING,
      amountLabel: formatCurrency(pending),
    },
    {
      name: t("pages.earningsOverview.remaining30dGrossPctLabel", { pct: remainderPct.toFixed(0) }),
      value: remainder,
      color: GRAY,
      amountLabel: formatCurrency(remainder),
    },
  ];

  return (
    <EarningsDonutCard
      title={t("pages.earningsOverview.pendingVsPendingGrossTitle")}
      centerPct={pct}
      centerLabel={t("status.pending")}
      segments={segments}
      footerAction={{ label: t("pages.assignmentHistory.viewPayoutsLink"), to: "/earnings/payouts" }}
    />
  );
}
