import { useTranslation } from "react-i18next";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";
import { PageHeader } from "../../theme/PageHeader";
import { ExportIcon } from "../../theme/actionMenuIcons";
import { EarningsOverviewDateRange } from "./EarningsOverviewDateRange";

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3 4h18M6 12h12M10 20h4"
      />
    </svg>
  );
}

type EarningsOverviewHeaderProps = {
  dateFrom: string;
  dateTo: string;
  onDateRangeChange: (from: string, to: string) => void;
  onExport: () => void;
  exportDisabled?: boolean;
  filtersOpen: boolean;
  onToggleFilters: () => void;
};

export function EarningsOverviewHeader({
  dateFrom,
  dateTo,
  onDateRangeChange,
  onExport,
  exportDisabled,
  filtersOpen,
  onToggleFilters,
}: EarningsOverviewHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="shrink-0 border-b border-border/60 bg-surface-card/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          title={t("pages.earningsOverview.title")}
          description={t("pages.earningsOverview.subtitle")}
          breadcrumbs={[
            { label: t("nav.dashboard"), to: "/dashboard" },
            { label: t("pages.earningsOverview.title") },
          ]}
          className="border-0 bg-transparent px-0 py-4 sm:py-[1.125rem]"
          actions={
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <EarningsOverviewDateRange
                dateFrom={dateFrom}
                dateTo={dateTo}
                onChange={onDateRangeChange}
              />
              <button
                type="button"
                onClick={onExport}
                disabled={exportDisabled}
                className={`${btnSecondary} gap-2 text-sm`}
              >
                <ExportIcon className="h-4 w-4" />
                {t("common.export")}
              </button>
              <button
                type="button"
                onClick={onToggleFilters}
                className={`${btnPrimary} gap-2 text-sm ${filtersOpen ? "ring-2 ring-brand/25" : ""}`}
                aria-pressed={filtersOpen}
              >
                <FilterIcon className="h-4 w-4" />
                {t("pages.driversList.filtersButton")}
              </button>
            </div>
          }
        />
      </div>
    </div>
  );
}
