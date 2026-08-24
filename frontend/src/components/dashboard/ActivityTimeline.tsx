import { useTranslation } from "react-i18next";
import type { ActivityRow } from "./ActivityTable";
import { DashboardChartCard } from "./DashboardChartCard";
import { EmptyState } from "../theme/EmptyState";
import { ActivityEmptyIllustration } from "./illustrations/ActivityEmptyIllustration";

function ActivityIcon({ type }: { type?: ActivityRow["type"] }) {
  const base = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full";
  if (type === "success") {
    return (
      <span className={`${base} bg-brand-mint text-brand`}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (type === "warning") {
    return (
      <span className={`${base} bg-accent-gold/20 text-accent-gold`}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01" />
        </svg>
      </span>
    );
  }
  return (
    <span className={`${base} bg-surface text-ink-muted`}>
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </span>
  );
}

export interface ActivityTimelineProps {
  title?: string;
  rows: ActivityRow[];
  emptyMessage?: string;
  isLoading?: boolean;
  isError?: boolean;
}

export function ActivityTimeline({
  title,
  rows,
  emptyMessage,
  isLoading,
  isError,
}: ActivityTimelineProps) {
  const { t } = useTranslation();
  return (
    <DashboardChartCard title={title ?? t("dashboardCharts.activityFeedTitle")} minHeight={320}>
      {isLoading ? (
        <p className="text-sm text-ink-muted py-8 text-center">{t("common.loading")}</p>
      ) : isError ? (
        <p className="text-sm text-danger py-8 text-center">{t("common.failedToLoad")}</p>
      ) : rows.length === 0 ? (
        <EmptyState
          title={emptyMessage ?? t("dashboardCharts.noRecentActivity")}
          description={t("dashboardCharts.activityEmptyDesc")}
          illustration={<ActivityEmptyIllustration />}
          className="border-0 bg-transparent py-8"
        />
      ) : (
        <ul className="relative space-y-0">
          {rows.map((row, i) => (
            <li key={row.id} className="relative flex gap-4 pb-6 last:pb-0">
              {i < rows.length - 1 && (
                <span
                  className="absolute left-4 top-10 bottom-0 w-px bg-border"
                  aria-hidden
                />
              )}
              <ActivityIcon type={row.type} />
              <div className="min-w-0 flex-1 rounded-xl border border-border/60 bg-surface-elevated/50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{row.description}</p>
                    {row.meta && <p className="mt-0.5 text-xs text-ink-muted line-clamp-2">{row.meta}</p>}
                  </div>
                  <time className="shrink-0 text-xs text-ink-muted whitespace-nowrap tabular-nums">
                    {row.time}
                  </time>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardChartCard>
  );
}
