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
  const gross = kpis.totalEarningsLast30Days;
  const commission = estimatedCommission30d(kpis, monthly);
  const pct = commissionSharePct(commission, gross);

  const segments = [
    {
      name: `Commission (${pct.toFixed(0)}%)`,
      value: commission,
      color: CHART_BRAND,
      amountLabel: formatCurrency(commission),
    },
    {
      name: `Gross (${(100 - pct).toFixed(0)}%)`,
      value: Math.max(0, gross),
      color: GRAY,
      amountLabel: formatCurrency(gross),
    },
  ];

  return (
    <EarningsDonutCard
      title="Commission vs Gross (30 days)"
      centerPct={pct}
      centerLabel="Commission"
      segments={segments}
      footerNote={
        monthly.length > 0 ? "Estimated from monthly commission ratio" : undefined
      }
      footerAction={{ label: "View commission report", to: "/earnings/reports" }}
    />
  );
}
