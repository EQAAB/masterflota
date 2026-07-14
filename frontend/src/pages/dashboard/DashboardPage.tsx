import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  getDashboardStats,
  getDriverStatusDistribution,
  getDocumentStats,
  getPlatformEarnings,
  getRecentActivity,
  getRecentAssignments,
} from "../../api/dashboard";
import type { DashboardActivityItem } from "../../api/dashboard";
import { KpiStatCard } from "../../components/dashboard/KpiStatCard";
import type { ActivityRow } from "../../components/dashboard/ActivityTable";
import { ActivityTimeline } from "../../components/dashboard/ActivityTimeline";
import { AssignmentsFeed } from "../../components/dashboard/AssignmentsFeed";
import { DriverStatusChart } from "../../components/dashboard/DriverStatusChart";
import { DocumentStatsChart } from "../../components/dashboard/DocumentStatsChart";
import { PlatformEarningsChart } from "../../components/dashboard/PlatformEarningsChart";
import { DashboardChartCard } from "../../components/dashboard/DashboardChartCard";
import { buildDashboardAlerts, DashboardTopBar } from "../../components/layout/DashboardTopBar";
import { EmptyState } from "../../components/theme/EmptyState";
import { useCanAccessFinance, usePermission } from "../../lib/permissions";
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

function AlertIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
    </svg>
  );
}

export function DashboardPage() {
  const canFinance = useCanAccessFinance();
  const canImport = usePermission("imports.create");
  const [preset, setPreset] = useState<DashboardDatePreset>("week");
  const [customDate, setCustomDate] = useState(() => localIsoDate(new Date()));
  const range = useMemo(() => resolveDashboardDateRange(preset, customDate), [preset, customDate]);
  const rangeLabel = formatDashboardRangeLabel(range);
  const periodParams = range;

  const statsQuery = useQuery({
    queryKey: ["dashboard", "stats", range.from, range.to],
    queryFn: () => getDashboardStats(periodParams),
  });
  const platformQuery = useQuery({
    queryKey: ["dashboard", "platform-earnings", range.from, range.to],
    queryFn: () => getPlatformEarnings(periodParams).then((r) => r.data),
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
  const platformData = platformQuery.data?.platforms ?? [];

  const alerts = useMemo(() => (stats ? buildDashboardAlerts(stats) : []), [stats]);

  const isLoading = statsQuery.isLoading || statusQuery.isLoading;
  const isError = statsQuery.isError || statusQuery.isError;
  const isPeriodLoading =
    statsQuery.isFetching || activityQuery.isFetching || assignmentsQuery.isFetching || platformQuery.isFetching;

  const topBar = (
    <DashboardTopBar
      preset={preset}
      customDate={customDate}
      onPresetChange={setPreset}
      onCustomDateChange={setCustomDate}
      rangeLabel={rangeLabel}
      alerts={alerts}
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
            <div>
              <h2 className={dashboardSectionTitle}>Fleet snapshot</h2>
              <p className="mt-1 text-xs text-ink-muted">Live counts — not limited by the date filter</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            <Link to="/drivers" className={`block ${kpiCardHover}`}>
              <KpiStatCard title="Total drivers" value={stats.totalDrivers} subtitle="Current roster" icon={<UsersIcon />} />
            </Link>
            <Link to="/drivers" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title="Active drivers"
                value={stats.activeDrivers}
                subtitle="Employment status = active"
                icon={<UsersIcon />}
              />
            </Link>
            <Link to="/drivers" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title="Pending documents"
                value={stats.pendingDocuments}
                subtitle="Needs review"
                icon={<DocumentIcon />}
              />
            </Link>
            <Link to="/drivers" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title="Expired documents"
                value={stats.expiredDocuments}
                subtitle="Past expiry date"
                trend={stats.expiredDocuments > 0 ? { value: "needs attention", positive: false } : undefined}
                icon={<DocumentIcon />}
              />
            </Link>
            <Link to="/vehicles" className={`block ${kpiCardHover}`}>
              <KpiStatCard title="Total vehicles" value={stats.totalVehicles ?? 0} subtitle="Current fleet" icon={<VehicleIcon />} />
            </Link>
            <Link to="/vehicles" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title="Assigned vehicles"
                value={stats.assignedVehicles ?? 0}
                subtitle="Drivers with a vehicle"
                icon={<VehicleIcon />}
              />
            </Link>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className={dashboardSectionTitle}>Needs attention</h2>
              <p className="mt-1 text-xs text-ink-muted">Open risks across loans, debt, rentals, and documents</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/earnings/loans" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title="Outstanding loans"
                value={formatCurrency(stats.outstandingLoans ?? 0)}
                subtitle={`${stats.driversWithLoans ?? 0} driver(s)`}
                trend={(stats.outstandingLoans ?? 0) > 0 ? { value: "open balance", positive: false } : undefined}
                icon={<AlertIcon />}
              />
            </Link>
            <Link to="/earnings/payouts" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title="Platform debt"
                value={formatCurrency(stats.outstandingDebt ?? 0)}
                subtitle={`${stats.driversWithDebt ?? 0} driver(s)`}
                trend={(stats.outstandingDebt ?? 0) > 0 ? { value: "collectible", positive: false } : undefined}
                icon={<CurrencyIcon />}
              />
            </Link>
            <Link to="/rentals/bookings" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title="Overdue rentals"
                value={stats.overdueRentals ?? 0}
                subtitle="Active bookings past end"
                trend={(stats.overdueRentals ?? 0) > 0 ? { value: "past due", positive: false } : undefined}
                icon={<VehicleIcon />}
              />
            </Link>
            <Link to="/drivers" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title="Document risk"
                value={(stats.expiredDocuments ?? 0) + (stats.pendingDocuments ?? 0)}
                subtitle={`${stats.expiredDocuments} expired · ${stats.pendingDocuments} pending`}
                icon={<DocumentIcon />}
              />
            </Link>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className={dashboardSectionTitle}>Period money</h2>
              <p className="mt-1 text-xs text-ink-muted">Filtered by {rangeLabel} (paid/approved commission & pending nets)</p>
            </div>
            {isPeriodLoading && (
              <p className="text-xs text-ink-muted" aria-live="polite">
                Updating period metrics…
              </p>
            )}
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <KpiStatCard
              title="Commission earned"
              value={formatCurrency(stats.totalCommissionEarned ?? 0)}
              subtitle="Paid / approved weeks in period"
              icon={<CurrencyIcon />}
            />
            <Link to="/earnings/payouts" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title="Pending payments"
                value={formatCurrency(stats.pendingPayments ?? 0)}
                subtitle={`${stats.pendingPayoutRows ?? 0} pending payout row(s)`}
                icon={<CurrencyIcon />}
              />
            </Link>
            <Link to="/earnings/payouts" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title="Vehicle rental fees"
                value={formatCurrency(stats.totalVehicleRentalFees ?? 0)}
                subtitle="Deducted in period payouts"
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
              title="Revenue by platform"
              description={`Gross vs company commission for ${rangeLabel}`}
              action={canFinance ? { label: "Open earnings overview", to: "/earnings" } : undefined}
              minHeight={320}
            >
              {platformQuery.isLoading ? (
                <p className="py-16 text-center text-sm text-ink-muted">Loading platform chart…</p>
              ) : (
                <PlatformEarningsChart data={platformData} />
              )}
            </DashboardChartCard>
            <DashboardChartCard title="Document verification">
              <DocumentStatsChart data={docsData} />
            </DashboardChartCard>
            <DashboardChartCard
              title="Earnings tools"
              description="Import reports and manage payouts from Earnings."
              minHeight={320}
            >
              <div className="flex flex-col items-start justify-center gap-3 py-4">
                <p className="text-sm text-ink-muted">
                  Platform reports, driver payouts, loans, and settlements live under Earnings in the sidebar.
                </p>
                <div className="flex flex-wrap gap-2">
                  {canFinance && (
                    <Link to="/earnings" className={btnSecondary}>
                      Earnings overview
                    </Link>
                  )}
                  {canImport && (
                    <Link to="/earnings/import" className={btnSecondary}>
                      Import earnings
                    </Link>
                  )}
                  {canFinance && (
                    <Link to="/earnings/payouts" className={btnSecondary}>
                      Payouts
                    </Link>
                  )}
                </div>
              </div>
            </DashboardChartCard>
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
