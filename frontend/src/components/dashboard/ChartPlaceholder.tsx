import { DashboardChartCard } from "./DashboardChartCard";
import { ChartEmptyIllustration } from "./illustrations/ChartEmptyIllustration";
import { btnSecondary } from "../../theme/classNames";

export interface ChartPlaceholderProps {
  title?: string;
  description?: string;
  height?: number;
  className?: string;
}

export function ChartPlaceholder({
  title = "Revenue by platform",
  description = "Platform breakdown will appear when earnings data is connected.",
  height = 220,
  className = "",
}: ChartPlaceholderProps) {
  return (
    <DashboardChartCard title={title} description={description} className={className}>
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-surface-elevated/60"
        style={{ height }}
      >
        <ChartEmptyIllustration className="w-28 h-28 text-brand" />
        <p className="mt-2 text-sm font-medium text-ink-muted">Chart coming soon</p>
        <button type="button" className={`${btnSecondary} mt-4 text-xs`} disabled>
          Connect data source
        </button>
      </div>
    </DashboardChartCard>
  );
}
