import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";
import type { PlatformEarningsItem } from "../../api/dashboard";
import { CHART_BRAND, CHART_COLORS } from "./chartPalette";
import { EmptyState } from "../theme/EmptyState";
import { ChartEmptyIllustration } from "./illustrations/ChartEmptyIllustration";
import { formatCurrency } from "../../utils/currency";
import i18n from "../../i18n";

const PROPER_NOUN_PLATFORMS = new Set(["uber", "bolt", "glovo"]);

function platformLabel(platform: string): string {
  if (PROPER_NOUN_PLATFORMS.has(platform)) return platform.charAt(0).toUpperCase() + platform.slice(1);
  return i18n.t(`dashboardCharts.platform.${platform}`, { defaultValue: platform });
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-card">
      <p className="mb-1 font-medium text-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="tabular-nums text-ink-muted">
          <span style={{ color: p.color }}>{p.name}</span>: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export function PlatformEarningsChart({ data }: { data: PlatformEarningsItem[] }) {
  const { t } = useTranslation();
  const chartData = data.map((d) => ({
    name: platformLabel(d.platform),
    Gross: d.gross,
    Commission: d.commission,
  }));

  if (!chartData.length || chartData.every((d) => d.Gross === 0 && d.Commission === 0)) {
    return (
      <EmptyState
        title={t("dashboardCharts.noEarningsTitle")}
        description={t("dashboardCharts.noEarningsDesc")}
        illustration={<ChartEmptyIllustration className="w-20 h-20" />}
        className="border-0 bg-transparent py-6"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} />
        <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} width={56} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#6B7280" }} />
        <Bar dataKey="Gross" name={t("dashboardCharts.gross")} fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} maxBarSize={36} />
        <Bar dataKey="Commission" name={t("dashboardCharts.commission")} fill={CHART_BRAND} radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
