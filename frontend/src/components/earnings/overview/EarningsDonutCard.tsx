import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { btnSecondary, chartCard } from "../../../theme/classNames";

export type DonutSegment = {
  name: string;
  value: number;
  color: string;
  amountLabel: string;
};

type EarningsDonutCardProps = {
  title: string;
  centerPct: number;
  centerLabel: string;
  segments: DonutSegment[];
  footerNote?: string;
  footerAction: { label: string; to: string };
  children?: ReactNode;
};

export function EarningsDonutCard({
  title,
  centerPct,
  centerLabel,
  segments,
  footerNote,
  footerAction,
}: EarningsDonutCardProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const chartData = total > 0 ? segments.filter((s) => s.value > 0) : [{ name: "Empty", value: 1, color: "#E5E7EB", amountLabel: "—" }];

  return (
    <div className={`${chartCard} flex min-h-[320px] flex-col`}>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>

      <div className="mt-4 flex flex-1 flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative mx-auto h-44 w-44 shrink-0 sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={78}
                dataKey="value"
                nameKey="name"
                paddingAngle={2}
                stroke="transparent"
              >
                {chartData.map((seg, i) => (
                  <Cell key={i} fill={seg.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums text-ink">{centerPct.toFixed(0)}%</span>
            <span className="text-xs text-ink-muted">{centerLabel}</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          {segments.map((seg) => (
            <div key={seg.name} className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-sm text-ink-muted">{seg.name}</span>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums text-ink">{seg.amountLabel}</span>
            </div>
          ))}
          {footerNote && <p className="text-xs italic text-ink-muted">{footerNote}</p>}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border/60">
        <Link to={footerAction.to} className={`${btnSecondary} text-sm`}>
          {footerAction.label}
        </Link>
      </div>
    </div>
  );
}
