import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  getDashboardStats,
  getDriverStatusDistribution,
  getDocumentStats,
  getRecentActivity,
  getRecentAssignments,
} from "../../api/dashboard";
import type { DashboardActivityItem } from "../../api/dashboard";
import { KpiStatCard } from "../../components/dashboard/KpiStatCard";
import { ChartPlaceholder } from "../../components/dashboard/ChartPlaceholder";
import type { ActivityRow } from "../../components/dashboard/ActivityTable";
import { ActivityTimeline } from "../../components/dashboard/ActivityTimeline";
import { AssignmentsFeed } from "../../components/dashboard/AssignmentsFeed";
import { DriverStatusChart } from "../../components/dashboard/DriverStatusChart";
import { DocumentStatsChart } from "../../components/dashboard/DocumentStatsChart";
import { DashboardChartCard } from "../../components/dashboard/DashboardChartCard";
import { DashboardTopBar } from "../../components/layout/DashboardTopBar";
import { EmptyState } from "../../components/theme/EmptyState";
import { dashboardPage, dashboardSectionTitle, kpiCardHover, btnSecondary } from "../../theme/classNames";
import { formatCurrency } from "../../utils/currency";
import { localIsoDate } from "../../utils/earningsImportWeek";
import {
  formatDashboardRangeLabel,
  resolveDashboardDateRange,
  type DashboardDatePreset,
} from "../../utils/dashboardDateRange";

const ACTIVITY_LABELS: Record<string, string> = {
  profile_update: "Profile updated",
  status_change: "Status changed",
  document_upload: "Document uploaded",
  document_verify: "Document verified",
  document_delete: "Document deleted",
  driver_delete: "Driver deleted",
  notes_update: "Notes updated",
};

function formatTime(createdAt: string): string {
  try {
    const d = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  } catch {
    return createdAt;
  }
}

function activityToRows(activities: DashboardActivityItem[]): ActivityRow[] {
  return activities.map((a) => ({
    id: a.id,
    description: ACTIVITY_LABELS[a.activity_type] ?? a.activity_type,
    meta: a.activity_description ?? undefined,
    time: formatTime(a.created_at),
    type: a.activity_type === "document_verify" ? "success" : "default",
  }));
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function VehicleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3 13l2-5.5A2 2 0 017 6h10a2 2 0 011.87 1.3L21 13m-2 0h-2M5 13H3m2 0v4m12-4v4M7 17h2m6 0h2M7 17a2 2 0 01-2-2v-2m12 4a2 2 0 002-2v-2M7 17h6"
      />
    </svg>
  );
}

export function DashboardPage() {
  const [preset, setPreset] = useState<DashboardDatePreset>("week");
  const [customDate, setCustomDate] = useState(() => localIsoDate(new Date()));
  const range = useMemo(() => resolveDashboardDateRange(preset, customDate), [preset, customDate]);
  const rangeLabel = formatDashboardRangeLabel(range);
  const periodParams = range;

  const statsQuery = useQuery({
    queryKey: ["dashboard", "stats", range.from, range.to],
    queryFn: () => getDashboardStats(periodParams),
  });
  const statusQuery = useQuery({ queryKey: ["dashboard", "status"], queryFn: () => getDriverStatusDistribution() });
  const docsQuery = useQuery({ queryKey: ["dashboard", "documents"], queryFn: () => getDocumentStats() });
  const activityQuery = useQuery({
    queryKey: ["dashboard", "activity", range.from, range.to],
    queryFn: () => getRecentActivity(periodParams),
  });
  const assignmentsQuery = useQuery({
    queryKey: ["dashboard", "recent-assignments", range.from, range.to],
    queryFn: () => getRecentAssignments(5, periodParams).then((r) => r.data.items),
  });

  const stats = statsQuery.data?.data;
  const statusData = statusQuery.data?.data ?? [];
  const docsData = docsQuery.data?.data ?? [];
  const activities = activityQuery.data?.data ?? [];
  const recentAssignments = assignmentsQuery.data ?? [];

  const isLoading = statsQuery.isLoading || statusQuery.isLoading;
  const isError = statsQuery.isError || statusQuery.isError;
  const isPeriodLoading = statsQuery.isFetching || activityQuery.isFetching || assignmentsQuery.isFetching;

  const topBar = (
    <DashboardTopBar
      preset={preset}
      customDate={customDate}
      onPresetChange={setPreset}
      onCustomDateChange={setCustomDate}
      rangeLabel={rangeLabel}
    />
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        {topBar}
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <p className="text-sm text-ink-muted">Loading dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-1 flex-col">
        {topBar}
        <div className="flex flex-1 items-center justify-center p-6">
          <EmptyState
            title="Failed to load dashboard"
            description="We couldn't fetch your fleet metrics. Check your connection and try again."
            action={{ label: "Go to drivers", to: "/drivers" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {topBar}

      <div className={dashboardPage}>
        <section>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className={dashboardSectionTitle}>Overview</h2>
            {isPeriodLoading && (
              <p className="text-xs text-ink-muted" aria-live="polite">
                Updating period metrics…
              </p>
            )}
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            <Link to="/drivers" className={`block ${kpiCardHover}`}>
              <KpiStatCard title="Total drivers" value={stats.totalDrivers} icon={<UsersIcon />} />
            </Link>
            <Link to="/drivers" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title="Active drivers"
                value={stats.activeDrivers}
                trend={{ value: "current snapshot", positive: true }}
                icon={<UsersIcon />}
              />
            </Link>
            <KpiStatCard title="Pending documents" value={stats.pendingDocuments} icon={<DocumentIcon />} />
            <KpiStatCard
              title="Expired documents"
              value={stats.expiredDocuments}
              trend={{ value: "needs attention", positive: false }}
              icon={<DocumentIcon />}
            />
            <Link to="/vehicles" className={`block ${kpiCardHover}`}>
              <KpiStatCard title="Total vehicles" value={stats.totalVehicles ?? 0} icon={<VehicleIcon />} />
            </Link>
            <Link to="/vehicles" className={`block ${kpiCardHover}`}>
              <KpiStatCard title="Assigned vehicles" value={stats.assignedVehicles ?? 0} icon={<VehicleIcon />} />
            </Link>
            <KpiStatCard
              title="Commission earned"
              value={formatCurrency(stats.totalCommissionEarned ?? 0)}
              trend={{ value: rangeLabel, positive: true }}
              icon={<CurrencyIcon />}
            />
            <KpiStatCard
              title="Pending payments"
              value={formatCurrency(stats.pendingPayments ?? 0)}
              trend={{ value: rangeLabel, positive: false }}
              icon={<CurrencyIcon />}
            />
            <Link to="/earnings/payouts" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title="Vehicle rental fees"
                value={formatCurrency(stats.totalVehicleRentalFees ?? 0)}
                trend={{ value: rangeLabel, positive: true }}
                icon={<VehicleIcon />}
              />
            </Link>
          </div>
        </section>

        <section>
          <h2 className={dashboardSectionTitle}>Analytics</h2>
          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardChartCard title="Driver status">
              <DriverStatusChart data={statusData} />
            </DashboardChartCard>
            <DashboardChartCard
              title="Earnings"
              description="Charts and import live under the Earnings section in the sidebar."
              action={{ label: "Open earnings overview", to: "/earnings" }}
              minHeight={320}
            >
              <div className="flex flex-col items-start justify-center gap-3 py-4">
                <p className="text-sm text-ink-muted">
                  Import platform reports, review payouts, and run settlement reports from one place.
                </p>
                <Link to="/earnings/import" className={btnSecondary}>
                  Import earnings
                </Link>
              </div>
            </DashboardChartCard>
            <DashboardChartCard title="Document verification">
              <DocumentStatsChart data={docsData} />
            </DashboardChartCard>
            <ChartPlaceholder />
          </div>
        </section>

        <section>
          <h2 className={dashboardSectionTitle}>Recent activity</h2>
          <p className="mt-1 text-xs text-ink-muted">Showing activity and assignments in {rangeLabel}</p>
          <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ActivityTimeline rows={activityToRows(activities)} />
            <AssignmentsFeed items={recentAssignments} isLoading={assignmentsQuery.isLoading} />
          </div>
        </section>
      </div>
    </div>
  );
}
