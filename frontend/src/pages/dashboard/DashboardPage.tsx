import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import {
  fetchOpsDigest,
  getDashboardStats,
  getDriverStatusDistribution,
  getDocumentStats,
  getPlatformEarnings,
  getRecentActivity,
  getRecentAssignments,
} from "../../api/dashboard";
import type { DashboardActivityItem } from "../../api/dashboard";
import { KpiStatCard } from "../../components/dashboard/KpiStatCard";
import { OpsDigestCard } from "../../components/dashboard/OpsDigestCard";
import type { ActivityRow } from "../../components/dashboard/ActivityTable";
import { ActivityTimeline } from "../../components/dashboard/ActivityTimeline";
import { AssignmentsFeed } from "../../components/dashboard/AssignmentsFeed";
import { DriverStatusChart } from "../../components/dashboard/DriverStatusChart";
import { DocumentStatsChart } from "../../components/dashboard/DocumentStatsChart";
import { PlatformEarningsChart } from "../../components/dashboard/PlatformEarningsChart";
import { DashboardChartCard } from "../../components/dashboard/DashboardChartCard";
import { buildDashboardAlerts, DashboardTopBar } from "../../components/layout/DashboardTopBar";
import { EmptyState } from "../../components/theme/EmptyState";
import { useCanAccessFinance, useCanViewPayouts, usePermission } from "../../lib/permissions";
import { dashboardPage, dashboardSectionTitle, kpiCardHover, btnSecondary } from "../../theme/classNames";
import { formatCurrency } from "../../utils/currency";
import { localIsoDate } from "../../utils/earningsImportWeek";
import {
  formatDashboardRangeLabel,
  resolveDashboardDateRange,
  type DashboardDatePreset,
} from "../../utils/dashboardDateRange";

function formatTime(createdAt: string): string {
  try {
    const d = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return i18n.t("timeAgo.justNow");
    if (diffMins < 60) return i18n.t("timeAgo.minutesAgo", { count: diffMins });
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return i18n.t("timeAgo.hoursAgo", { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return i18n.t("timeAgo.daysAgo", { count: diffDays });
    return d.toLocaleDateString();
  } catch {
    return createdAt;
  }
}

function activityToRows(activities: DashboardActivityItem[]): ActivityRow[] {
  return activities.map((a) => ({
    id: a.id,
    description: i18n.exists(`activityLabel.${a.activity_type}`)
      ? i18n.t(`activityLabel.${a.activity_type}`)
      : a.activity_type,
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
  const { t } = useTranslation();
  const canFinance = useCanAccessFinance();
  const canViewPayouts = useCanViewPayouts();
  const canViewDrivers = usePermission("drivers.view");
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
  const opsDigestQuery = useQuery({
    queryKey: ["dashboard", "ops-digest", range.from, range.to],
    queryFn: () => fetchOpsDigest(periodParams).then((r) => r.data),
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
            <p className="text-sm text-ink-muted">{t("pages.dashboard.loading")}</p>
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
            title={t("pages.dashboard.failedTitle")}
            description={t("pages.dashboard.failedDescription")}
            action={{ label: t("pages.dashboard.goToDrivers"), to: "/drivers" }}
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
              <h2 className={dashboardSectionTitle}>{t("pages.dashboard.fleetSnapshotTitle")}</h2>
              <p className="mt-1 text-xs text-ink-muted">{t("pages.dashboard.fleetSnapshotHint")}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            <Link to="/drivers" className={`block ${kpiCardHover}`}>
              <KpiStatCard title={t("pages.dashboard.kpiTotalDrivers")} value={stats.totalDrivers} subtitle={t("pages.dashboard.kpiTotalDriversSub")} icon={<UsersIcon />} />
            </Link>
            <Link to="/drivers" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title={t("pages.dashboard.kpiActiveDrivers")}
                value={stats.activeDrivers}
                subtitle={t("pages.dashboard.kpiActiveDriversSub")}
                icon={<UsersIcon />}
              />
            </Link>
            <Link to="/drivers" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title={t("pages.dashboard.kpiPendingDocuments")}
                value={stats.pendingDocuments}
                subtitle={t("pages.dashboard.kpiPendingDocumentsSub")}
                icon={<DocumentIcon />}
              />
            </Link>
            <Link to="/drivers" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title={t("pages.dashboard.kpiExpiredDocuments")}
                value={stats.expiredDocuments}
                subtitle={t("pages.dashboard.kpiExpiredDocumentsSub")}
                trend={stats.expiredDocuments > 0 ? { value: t("pages.dashboard.trendNeedsAttention"), positive: false } : undefined}
                icon={<DocumentIcon />}
              />
            </Link>
            <Link to="/vehicles" className={`block ${kpiCardHover}`}>
              <KpiStatCard title={t("pages.dashboard.kpiTotalVehicles")} value={stats.totalVehicles ?? 0} subtitle={t("pages.dashboard.kpiTotalVehiclesSub")} icon={<VehicleIcon />} />
            </Link>
            <Link to="/vehicles" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title={t("pages.dashboard.kpiAssignedVehicles")}
                value={stats.assignedVehicles ?? 0}
                subtitle={t("pages.dashboard.kpiAssignedVehiclesSub")}
                icon={<VehicleIcon />}
              />
            </Link>
          </div>
        </section>

        <OpsDigestCard
          items={opsDigestQuery.data?.items ?? []}
          narrative={opsDigestQuery.data?.narrative ?? null}
          aiEnabled={opsDigestQuery.data?.aiEnabled ?? false}
          isLoading={opsDigestQuery.isLoading}
          isError={opsDigestQuery.isError}
        />

        <section>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className={dashboardSectionTitle}>{t("pages.dashboard.needsAttentionTitle")}</h2>
              <p className="mt-1 text-xs text-ink-muted">{t("pages.dashboard.needsAttentionHint")}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.outstandingLoans != null && (
              canViewDrivers ? (
            <Link to="/earnings/loans" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title={t("pages.dashboard.kpiOutstandingLoans")}
                value={formatCurrency(stats.outstandingLoans)}
                subtitle={t("common.driversCount", { count: stats.driversWithLoans ?? 0 })}
                trend={stats.outstandingLoans > 0 ? { value: t("pages.dashboard.trendOpenBalance"), positive: false } : undefined}
                icon={<AlertIcon />}
              />
            </Link>
              ) : (
              <KpiStatCard
                title={t("pages.dashboard.kpiOutstandingLoans")}
                value={formatCurrency(stats.outstandingLoans)}
                subtitle={t("common.driversCount", { count: stats.driversWithLoans ?? 0 })}
                trend={stats.outstandingLoans > 0 ? { value: t("pages.dashboard.trendOpenBalance"), positive: false } : undefined}
                icon={<AlertIcon />}
              />
              )
            )}
            {stats.outstandingDebt != null && (
              canViewPayouts ? (
            <Link to="/earnings/payouts" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title={t("pages.dashboard.kpiPlatformDebt")}
                value={formatCurrency(stats.outstandingDebt)}
                subtitle={t("common.driversCount", { count: stats.driversWithDebt ?? 0 })}
                trend={stats.outstandingDebt > 0 ? { value: t("pages.dashboard.trendCollectible"), positive: false } : undefined}
                icon={<CurrencyIcon />}
              />
            </Link>
              ) : (
              <KpiStatCard
                title={t("pages.dashboard.kpiPlatformDebt")}
                value={formatCurrency(stats.outstandingDebt)}
                subtitle={t("common.driversCount", { count: stats.driversWithDebt ?? 0 })}
                trend={stats.outstandingDebt > 0 ? { value: t("pages.dashboard.trendCollectible"), positive: false } : undefined}
                icon={<CurrencyIcon />}
              />
              )
            )}
            {stats.overdueRentals != null && (
            <Link to="/rentals/bookings" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title={t("pages.dashboard.kpiOverdueRentals")}
                value={stats.overdueRentals}
                subtitle={t("pages.dashboard.kpiOverdueRentalsSub")}
                trend={stats.overdueRentals > 0 ? { value: t("pages.dashboard.trendPastDue"), positive: false } : undefined}
                icon={<VehicleIcon />}
              />
            </Link>
            )}
            <Link to="/drivers" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title={t("pages.dashboard.kpiDocumentRisk")}
                value={(stats.expiredDocuments ?? 0) + (stats.pendingDocuments ?? 0)}
                subtitle={t("pages.dashboard.documentRiskSub", { expired: stats.expiredDocuments, pending: stats.pendingDocuments })}
                icon={<DocumentIcon />}
              />
            </Link>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className={dashboardSectionTitle}>{t("pages.dashboard.periodMoneyTitle")}</h2>
              <p className="mt-1 text-xs text-ink-muted">{t("pages.dashboard.periodMoneyHint", { range: rangeLabel })}</p>
            </div>
            {isPeriodLoading && (
              <p className="text-xs text-ink-muted" aria-live="polite">
                {t("pages.dashboard.updatingPeriodMetrics")}
              </p>
            )}
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stats.totalCommissionEarned != null ? (
            <KpiStatCard
              title={t("pages.dashboard.kpiCommissionEarned")}
              value={formatCurrency(stats.totalCommissionEarned)}
              subtitle={t("pages.dashboard.kpiCommissionEarnedSub")}
              icon={<CurrencyIcon />}
            />
            ) : (
              <KpiStatCard
                title={t("pages.dashboard.kpiCommissionEarned")}
                value={t("common.emDash")}
                subtitle={t("pages.dashboard.requiresEarningsAccess")}
                icon={<CurrencyIcon />}
              />
            )}
            {stats.pendingPayments != null ? (
            <Link to="/earnings/payouts" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title={t("pages.dashboard.kpiPendingPayments")}
                value={formatCurrency(stats.pendingPayments)}
                subtitle={t("pages.dashboard.pendingPayoutRows", { count: stats.pendingPayoutRows ?? 0 })}
                icon={<CurrencyIcon />}
              />
            </Link>
            ) : (
              <KpiStatCard
                title={t("pages.dashboard.kpiPendingPayments")}
                value={t("common.emDash")}
                subtitle={t("pages.dashboard.requiresPayoutAccess")}
                icon={<CurrencyIcon />}
              />
            )}
            {stats.totalVehicleRentalFees != null ? (
            <Link to="/earnings/payouts" className={`block ${kpiCardHover}`}>
              <KpiStatCard
                title={t("pages.dashboard.kpiVehicleRentalFees")}
                value={formatCurrency(stats.totalVehicleRentalFees)}
                subtitle={t("pages.dashboard.kpiVehicleRentalFeesSub")}
                icon={<VehicleIcon />}
              />
            </Link>
            ) : (
              <KpiStatCard
                title={t("pages.dashboard.kpiVehicleRentalFees")}
                value={t("common.emDash")}
                subtitle={t("pages.dashboard.requiresPayoutAccess")}
                icon={<VehicleIcon />}
              />
            )}
          </div>
        </section>

        <section>
          <h2 className={dashboardSectionTitle}>{t("pages.dashboard.analyticsTitle")}</h2>
          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardChartCard title={t("pages.dashboard.chartDriverStatus")}>
              <DriverStatusChart data={statusData} />
            </DashboardChartCard>
            <DashboardChartCard
              title={t("pages.dashboard.chartRevenueByPlatform")}
              description={t("pages.dashboard.chartRevenueByPlatformDesc", { range: rangeLabel })}
              action={canFinance ? { label: t("pages.dashboard.openEarningsOverview"), to: "/earnings" } : undefined}
              minHeight={320}
            >
              {platformQuery.isLoading ? (
                <p className="py-16 text-center text-sm text-ink-muted">{t("pages.dashboard.loadingPlatformChart")}</p>
              ) : platformQuery.isError ? (
                <p className="py-16 text-center text-sm text-danger">{t("pages.dashboard.failedPlatformChart")}</p>
              ) : (
                <PlatformEarningsChart data={platformData} />
              )}
            </DashboardChartCard>
            <DashboardChartCard title={t("pages.dashboard.chartDocumentVerification")}>
              {docsQuery.isError ? (
                <p className="py-16 text-center text-sm text-danger">{t("pages.dashboard.failedDocumentStats")}</p>
              ) : (
                <DocumentStatsChart data={docsData} />
              )}
            </DashboardChartCard>
            <DashboardChartCard
              title={t("pages.dashboard.earningsToolsTitle")}
              description={t("pages.dashboard.earningsToolsDesc")}
              minHeight={320}
            >
              <div className="flex flex-col items-start justify-center gap-3 py-4">
                <p className="text-sm text-ink-muted">
                  {t("pages.dashboard.earningsToolsBody")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {canFinance && (
                    <Link to="/earnings" className={btnSecondary}>
                      {t("pages.dashboard.earningsOverviewLink")}
                    </Link>
                  )}
                  {canImport && (
                    <Link to="/earnings/import" className={btnSecondary}>
                      {t("pages.dashboard.importEarningsLink")}
                    </Link>
                  )}
                  {canViewPayouts && (
                    <Link to="/earnings/payouts" className={btnSecondary}>
                      {t("pages.dashboard.payoutsLink")}
                    </Link>
                  )}
                </div>
              </div>
            </DashboardChartCard>
          </div>
        </section>

        <section>
          <h2 className={dashboardSectionTitle}>{t("pages.dashboard.recentActivityTitle")}</h2>
          <p className="mt-1 text-xs text-ink-muted">{t("pages.dashboard.recentActivityHint", { range: rangeLabel })}</p>
          <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ActivityTimeline
              rows={activityToRows(activities)}
              isLoading={activityQuery.isLoading}
              isError={activityQuery.isError}
            />
            <AssignmentsFeed
              items={recentAssignments}
              isLoading={assignmentsQuery.isLoading}
              isError={assignmentsQuery.isError}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
