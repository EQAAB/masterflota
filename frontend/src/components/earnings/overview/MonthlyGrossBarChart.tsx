import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EarningsOverviewResponse } from "../../../api/earnings";
import { CHART_BRAND, CHART_MINT } from "../../dashboard/chartPalette";
import { chartCard, inputCompact } from "../../../theme/classNames";
import { formatCurrency } from "../../../utils/currency";
import {
  filterMonthlyByRange,
  sliceMonthlyByPreset,
  type MonthRangePreset,
} from "./useEarningsOverviewDerived";

type MonthlyGrossBarChartProps = {
  monthly: EarningsOverviewResponse["monthly"];
  dateFrom?: string;
  dateTo?: string;
};

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-card">
      <p className="font-medium text-ink">{label}</p>
      <p className="tabular-nums text-brand">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function MonthlyGrossBarChart({ monthly, dateFrom, dateTo }: MonthlyGrossBarChartProps) {
  const [preset, setPreset] = useState<MonthRangePreset>("6");

  const chartData = useMemo(() => {
    let data = filterMonthlyByRange(monthly, dateFrom, dateTo);
    data = sliceMonthlyByPreset(data, preset);
    return data.map((m) => ({
      month: m.month,
      gross: m.totalEarnings,
    }));
  }, [monthly, dateFrom, dateTo, preset]);

  const maxGross = Math.max(0, ...chartData.map((d) => d.gross));

  return (
    <div className={chartCard}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">Monthly gross (bars)</h3>
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value as MonthRangePreset)}
          className={`${inputCompact} w-auto min-w-[140px] text-sm`}
          aria-label="Month range"
        >
          <option value="6">Last 6 months</option>
          <option value="12">Last 12 months</option>
          <option value="all">All months</option>
        </select>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-ink-muted">
          No monthly data for this range.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="grossBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_BRAND} stopOpacity={1} />
                <stop offset="100%" stopColor={CHART_MINT} stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="grossBarHighlight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0A6B5F" stopOpacity={1} />
                <stop offset="100%" stopColor={CHART_BRAND} stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EAECEF" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#6B7280" }}
              axisLine={{ stroke: "#EAECEF" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                new Intl.NumberFormat("ro-RO", { notation: "compact", maximumFractionDigits: 1 }).format(v)
              }
            />
            <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(11, 122, 110, 0.06)" }} />
            <Bar dataKey="gross" radius={[8, 8, 0, 0]} maxBarSize={56}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.month}
                  fill={entry.gross === maxGross && maxGross > 0 ? "url(#grossBarHighlight)" : "url(#grossBarGradient)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
