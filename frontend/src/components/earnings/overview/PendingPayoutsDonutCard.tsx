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
  const pending = kpis.pendingPaymentsTotal;
  const remainder = Math.max(0, kpis.totalEarningsLast30Days - pending);
  const pct = pendingSharePct(kpis);
  const remainderPct = 100 - pct;

  const segments = [
    {
      name: `Pending payouts (${pct.toFixed(0)}%)`,
      value: pending,
      color: CHART_WARNING,
      amountLabel: formatCurrency(pending),
    },
    {
      name: `Remaining 30d gross (${remainderPct.toFixed(0)}%)`,
      value: remainder,
      color: GRAY,
      amountLabel: formatCurrency(remainder),
    },
  ];

  return (
    <EarningsDonutCard
      title="Pending payouts vs Pending + 30d gross"
      centerPct={pct}
      centerLabel="Pending"
      segments={segments}
      footerAction={{ label: "View payouts", to: "/earnings/payouts" }}
    />
  );
}
