import { useTranslation } from "react-i18next";
import { alertError } from "../../theme/classNames";
import { ReportsPageHeader } from "../../components/earnings/reports/ReportsPageHeader";
import { ReportsFiltersSidebar } from "../../components/earnings/reports/ReportsFiltersSidebar";
import { ReportsKpiCards } from "../../components/earnings/reports/ReportsKpiCards";
import { ReportsCommissionCard } from "../../components/earnings/reports/ReportsCommissionCard";
import { ReportsDebtAnalytics } from "../../components/earnings/reports/ReportsDebtAnalytics";
import { ReportsCollectionSummary } from "../../components/earnings/reports/ReportsCollectionSummary";
import { ReportsPreviewTable } from "../../components/earnings/reports/ReportsPreviewTable";
import { useReportsPageState } from "../../components/earnings/reports/useReportsPageState";
import { REPORTS_UUID_RE } from "../../components/earnings/reports/reportsDisplayUtils";

export function EarningsReportsPage() {
  const { t } = useTranslation();
  const {
    canAccess,
    driverIdFromUrl,
    clearDriverUrlFilter,
    filters,
    collectionFrom,
    collectionTo,
    query,
    commissionByBaseQuery,
    agingQuery,
    collectionQuery,
    debtHistoryQuery,
    rows,
    summary,
    error,
    csvBusy,
    pdfBusy,
    exportCsv,
    exportPdf,
    previewRef,
    setVisibleRows,
  } = useReportsPageState();

  if (!canAccess) {
    return <p className="p-6 text-ink-muted">{t("common.noAccess")}</p>;
  }

  const showDebtHistory = Boolean(driverIdFromUrl && REPORTS_UUID_RE.test(driverIdFromUrl));

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <ReportsPageHeader
        csvBusy={csvBusy}
        pdfBusy={pdfBusy}
        reportsLoading={query.isLoading}
        onExportCsv={() => void exportCsv()}
        onExportPdf={() => void exportPdf()}
      />

      <div className="mx-auto max-w-[1600px] w-full flex-1 p-4 sm:p-6 lg:px-8 space-y-4">
        {error && <div className={alertError}>{error}</div>}

        {driverIdFromUrl && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-mint bg-brand-mint/80 px-3 py-2 text-sm text-ink">
            <span>{t("pages.earningsReports.driverFilterBanner")}</span>
            <button type="button" className="text-brand font-medium hover:underline" onClick={clearDriverUrlFilter}>
              {t("pages.earningsReports.clearDriverFilter")}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[288px_1fr] gap-4 items-start">
          <ReportsFiltersSidebar
            className="xl:sticky xl:top-4"
            filters={{
              from: filters.from,
              to: filters.to,
              q: filters.q,
              status: filters.status,
              minVehicleRental: filters.minVehicleRental,
              platform: filters.platform,
            }}
            onFromChange={filters.setFrom}
            onToChange={filters.setTo}
            onQChange={filters.setQ}
            onStatusChange={filters.setStatus}
            onMinVehicleRentalChange={filters.setMinVehicleRental}
            onPlatformChange={filters.setPlatform}
            onReset={filters.resetFilters}
          />

          <div className="space-y-4 min-w-0">
            <ReportsKpiCards summary={summary} loading={query.isLoading} />

            <ReportsCommissionCard
              items={commissionByBaseQuery.data?.items}
              loading={commissionByBaseQuery.isLoading}
            />

            <ReportsDebtAnalytics
              aging={agingQuery.data}
              agingLoading={agingQuery.isLoading}
              driverIdFromUrl={driverIdFromUrl}
              debtHistory={debtHistoryQuery.data}
              showDebtHistory={showDebtHistory}
            />

            <ReportsCollectionSummary
              collectionFrom={collectionFrom}
              collectionTo={collectionTo}
              collection={collectionQuery.data}
              collectionLoading={collectionQuery.isLoading}
            />

            {query.data?.truncated && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {t("pages.earningsReports.truncatedNotice", { limit: query.data.limit.toLocaleString() })}
              </div>
            )}

            <div ref={previewRef} className="min-w-0">
              <ReportsPreviewTable
                rows={rows}
                loading={query.isLoading}
                onVisibleRowsChange={setVisibleRows}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
