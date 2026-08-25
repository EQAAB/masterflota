import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { EarningsReportSummary } from "../../../api/earnings";
import { formatCurrency } from "../../../utils/currency";

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-7M16 12h.01"
      />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M4 5h4v4H4V5zm6 0h4v4h-4V5zm6 0h4v4h-4V5zM4 11h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 17h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"
      />
    </svg>
  );
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M5 17h14M6 17l1-5h10l1 5M7 12l1.5-4h7L17 12M8 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm6 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z"
      />
    </svg>
  );
}

function PercentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M19 5L5 19M7 7a2 2 0 100-4 2 2 0 000 4zm10 14a2 2 0 100-4 2 2 0 000 4z"
      />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
    </svg>
  );
}

function ReportsCompactKpiCard({
  title,
  value,
  icon,
  iconClassName,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="rounded-[14px] border border-border bg-white p-3 shadow-soft">
      <div className="flex items-start gap-2.5">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-ink-muted leading-tight">{title}</p>
          <p className="mt-0.5 truncate text-base font-bold tabular-nums text-ink">{value}</p>
        </div>
      </div>
    </div>
  );
}

type ReportsKpiCardsProps = {
  summary: EarningsReportSummary | undefined;
  loading?: boolean;
};

export function ReportsKpiCards({ summary, loading }: ReportsKpiCardsProps) {
  const { t } = useTranslation();
  const dash = loading ? "…" : "—";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <ReportsCompactKpiCard
        title={t("pages.earningsReports.kpiTotalPayout")}
        value={summary ? formatCurrency(summary.totalNetPayout) : dash}
        icon={<WalletIcon className="h-3.5 w-3.5" />}
        iconClassName="bg-success/10 text-success"
      />
      <ReportsCompactKpiCard
        title={t("pages.earningsReports.kpiRows")}
        value={summary ? summary.rowCount.toLocaleString() : dash}
        icon={<GridIcon className="h-3.5 w-3.5" />}
        iconClassName="bg-purple-100 text-purple-700"
      />
      <ReportsCompactKpiCard
        title={t("pages.earningsReports.kpiVehicleRentalTotal")}
        value={summary ? formatCurrency(summary.totalVehicleRental) : dash}
        icon={<CarIcon className="h-3.5 w-3.5" />}
        iconClassName="bg-blue-100 text-blue-700"
      />
      <ReportsCompactKpiCard
        title={t("pages.earningsReports.kpiFleetCommissionPeriod")}
        value={summary ? formatCurrency(summary.totalCompanyCommission ?? 0) : dash}
        icon={<PercentIcon className="h-3.5 w-3.5" />}
        iconClassName="bg-indigo-100 text-indigo-700"
      />
      <ReportsCompactKpiCard
        title={t("pages.earningsReports.kpiOutstandingDebt")}
        value={summary ? formatCurrency(summary.totalDebt) : dash}
        icon={<WarningIcon className="h-3.5 w-3.5" />}
        iconClassName="bg-red-100 text-red-700"
      />
    </div>
  );
}
