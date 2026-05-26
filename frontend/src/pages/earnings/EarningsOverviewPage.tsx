import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getEarningsOverview, getPayoutIntegrityRows } from "../../api/earnings";
import { useAuthStore } from "../../store/authStore";
import { driversPage } from "../../theme/classNames";
import { exportEarningsOverviewCsv } from "../../utils/exportEarningsOverviewCsv";
import { CommissionGrossDonutCard } from "../../components/earnings/overview/CommissionGrossDonutCard";
import { EarningsKpiCards } from "../../components/earnings/overview/EarningsKpiCards";
import { EarningsOverviewFilters } from "../../components/earnings/overview/EarningsOverviewFilters";
import { EarningsOverviewHeader } from "../../components/earnings/overview/EarningsOverviewHeader";
import { EarningsOverviewSkeleton } from "../../components/earnings/overview/EarningsOverviewSkeleton";
import { MonthlyGrossBarChart } from "../../components/earnings/overview/MonthlyGrossBarChart";
import { PayoutIntegrityTable } from "../../components/earnings/overview/PayoutIntegrityTable";
import { PendingPayoutsDonutCard } from "../../components/earnings/overview/PendingPayoutsDonutCard";
import {
  defaultDateRange,
  filterIntegrityRows,
  uniquePlatforms,
} from "../../components/earnings/overview/useEarningsOverviewDerived";

export function EarningsOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const driverFilter =
    searchParams.get("driver_id")?.trim() || searchParams.get("driverId")?.trim() || "";

  const [{ from: dateFrom, to: dateTo }, setDateRange] = useState(defaultDateRange);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "broken">("all");

  useEffect(() => {
    if (!driverFilter) return;
    navigate(`/earnings/payouts?driverId=${encodeURIComponent(driverFilter)}`, { replace: true });
  }, [driverFilter, navigate]);

  const overviewQuery = useQuery({
    queryKey: ["earnings", "overview"],
    queryFn: () => getEarningsOverview().then((r) => r.data),
    enabled: user?.role === "admin" || user?.role === "accountant",
  });

  const integrityQuery = useQuery({
    queryKey: ["earnings", "payout-integrity"],
    queryFn: () => getPayoutIntegrityRows().then((r) => r.data),
    enabled: user?.role === "admin" || user?.role === "accountant",
  });

  const allIntegrityRows = integrityQuery.data ?? [];

  const filteredIntegrityRows = useMemo(
    () =>
      filterIntegrityRows(allIntegrityRows, {
        dateFrom,
        dateTo,
        platform: platformFilter,
        statusFilter,
      }),
    [allIntegrityRows, dateFrom, dateTo, platformFilter, statusFilter],
  );

  const platforms = useMemo(() => uniquePlatforms(allIntegrityRows), [allIntegrityRows]);

  if (user?.role !== "admin" && user?.role !== "accountant") {
    return <p className="p-6 text-ink-muted">You do not have access to earnings.</p>;
  }

  const handleExport = () => {
    if (!overviewQuery.data) return;
    exportEarningsOverviewCsv({
      kpis: overviewQuery.data.kpis,
      integrityRows: filteredIntegrityRows,
      dateFrom,
      dateTo,
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <EarningsOverviewHeader
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateRangeChange={(from, to) => setDateRange({ from, to })}
        onExport={handleExport}
        exportDisabled={!overviewQuery.data}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((o) => !o)}
      />

      {overviewQuery.isLoading ? (
        <EarningsOverviewSkeleton />
      ) : overviewQuery.isError || !overviewQuery.data ? (
        <p className="p-6 text-danger">Could not load earnings overview.</p>
      ) : (
        <div className={driversPage}>
          <EarningsKpiCards kpis={overviewQuery.data.kpis} monthly={overviewQuery.data.monthly} />

          <EarningsOverviewFilters
            visible={filtersOpen}
            platform={platformFilter}
            onPlatformChange={setPlatformFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            platforms={platforms}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CommissionGrossDonutCard
              kpis={overviewQuery.data.kpis}
              monthly={overviewQuery.data.monthly}
            />
            <PendingPayoutsDonutCard kpis={overviewQuery.data.kpis} />
          </div>

          <MonthlyGrossBarChart
            monthly={overviewQuery.data.monthly}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />

          <PayoutIntegrityTable rows={filteredIntegrityRows} isLoading={integrityQuery.isLoading} />
        </div>
      )}
    </div>
  );
}
