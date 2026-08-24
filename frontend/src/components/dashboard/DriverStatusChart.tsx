import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { CHART_COLORS } from "./chartPalette";
import { EmptyState } from "../theme/EmptyState";
import { ChartEmptyIllustration } from "./illustrations/ChartEmptyIllustration";

export interface DriverStatusItem {
  status: string;
  count: number;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-card">
      <p className="font-medium text-ink">{p.name}</p>
      <p className="text-ink-muted tabular-nums">{p.value}</p>
    </div>
  );
}

export function DriverStatusChart(props: { data: DriverStatusItem[] }) {
  const { t } = useTranslation();
  const chartData = props.data.map((d) => ({
    name: i18n.exists(`driverStatus.${d.status?.toLowerCase()}`) ? t(`driverStatus.${d.status.toLowerCase()}`) : d.status,
    value: d.count,
  }));
  const empty = chartData.every((d) => d.value === 0);
  if (empty) {
    return (
      <EmptyState
        title={t("dashboardCharts.noDriverDataTitle")}
        description={t("dashboardCharts.noDriverDataDesc")}
        illustration={<ChartEmptyIllustration className="w-20 h-20" />}
        className="border-0 bg-transparent py-6"
      />
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={68}
          outerRadius={96}
          dataKey="value"
          nameKey="name"
          paddingAngle={2}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#6B7280" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
