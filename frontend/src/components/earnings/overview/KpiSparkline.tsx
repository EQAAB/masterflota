import { Area, AreaChart, ResponsiveContainer } from "recharts";

type KpiSparklineProps = {
  data: { value: number }[];
  color: string;
  fillColor?: string;
};

export function KpiSparkline({ data, color, fillColor }: KpiSparklineProps) {
  if (!data.length) {
    return <div className="h-10 w-20" aria-hidden />;
  }

  return (
    <div className="h-10 w-20 shrink-0" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor ?? color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={fillColor ?? color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#spark-${color.replace("#", "")})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
