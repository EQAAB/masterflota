import { DashboardCard } from "../theme/DashboardCard";
import { StatCard } from "../theme/StatCard";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: "slate" | "sky" | "green" | "amber" | "red" | "purple";
  trend?: string;
}

const tintMap: Record<string, "brand" | "success" | "warning" | "danger" | "neutral"> = {
  slate: "neutral",
  sky: "brand",
  green: "success",
  amber: "warning",
  red: "danger",
  purple: "brand",
};

export function StatsCard(props: StatsCardProps) {
  const { title, value, icon, color = "slate", trend } = props;
  return (
    <DashboardCard hover>
      <StatCard
        label={title}
        value={value}
        subtext={trend}
        icon={icon}
        iconTint={tintMap[color] ?? "neutral"}
        valueClassName="mt-1 text-2xl font-semibold tabular-nums text-ink"
      />
    </DashboardCard>
  );
}
