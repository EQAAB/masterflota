import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { OrgLoanListItem } from "../../../api/driverLoans";
import { loanStatusLabel } from "../../../api/driverLoans";
import { formatCurrency } from "../../../utils/currency";
import { transitionDefault } from "../../../theme/classNames";
import { EmptyState } from "../../theme/EmptyState";
import { driverLoanDisplayName, loanStatusBadgeClass } from "./loansReportDisplay";

const GRID_COLS = "minmax(160px, 1.4fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(90px, 0.8fr) minmax(100px, 0.9fr) minmax(90px, 0.7fr)";

type LoansReportTableProps = {
  rows: OrgLoanListItem[];
  loading: boolean;
  isError: boolean;
  showEmpty: boolean;
};

export function LoansReportTable({ rows, loading, isError, showEmpty }: LoansReportTableProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="space-y-2 rounded-[16px] border border-border/70 bg-white p-4 shadow-soft">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[16px] border border-danger/20 bg-danger/5 px-4 py-6 text-sm text-danger">
        {t("pages.driverLoans.failedToLoadLoans")}
      </div>
    );
  }

  if (showEmpty) {
    return (
      <EmptyState
        title={t("pages.driverLoans.noLoansFoundTitle")}
        description={t("pages.driverLoans.noLoansFoundDesc")}
      />
    );
  }

  return (
    <div className={`overflow-hidden rounded-[16px] border border-border/70 bg-white shadow-soft ${transitionDefault}`}>
      <div className="max-h-[68vh] overflow-auto">
        <div className="min-w-[720px]">
          <div
            className="sticky top-0 z-10 grid min-h-[40px] items-center border-b border-slate-200 bg-[#F8FAFC] px-3"
            style={{ gridTemplateColumns: GRID_COLS }}
          >
            {[
              t("pages.driversList.colDriver"),
              t("pages.driverLoans.colPrincipal"),
              t("pages.driverLoans.colRemaining"),
              t("common.status"),
              t("pages.driverLoans.colDisbursed"),
              t("pages.driverLoans.colReference"),
            ].map((h) => (
              <div
                key={h}
                className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
              >
                {h}
              </div>
            ))}
          </div>
          {rows.map((row) => {
            const name = driverLoanDisplayName(row.driver_first_name, row.driver_last_name);
            return (
              <div
                key={row.id}
                className="grid min-h-[52px] items-center border-b border-slate-100/90 px-3 transition-colors hover:bg-slate-50/80"
                style={{ gridTemplateColumns: GRID_COLS }}
              >
                <div className="px-2 py-2">
                  <Link
                    to={`/drivers/${row.driver_id}`}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    {name}
                  </Link>
                  {row.driver_phone && (
                    <p className="text-xs text-slate-500">{row.driver_phone}</p>
                  )}
                </div>
                <div className="px-2 py-2 text-sm tabular-nums text-slate-800">
                  {formatCurrency(Number(row.principal))}
                </div>
                <div className="px-2 py-2 text-sm font-medium tabular-nums text-slate-900">
                  {formatCurrency(Number(row.remaining_balance))}
                </div>
                <div className="px-2 py-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${loanStatusBadgeClass(row.status)}`}
                  >
                    {loanStatusLabel(row.status)}
                  </span>
                </div>
                <div className="px-2 py-2 text-sm text-slate-700">{row.disbursed_at}</div>
                <div className="px-2 py-2 text-sm text-slate-600 truncate">
                  <Link
                    to={`/earnings/loans/${row.id}`}
                    className="font-medium text-brand hover:underline"
                    title={row.reference ?? undefined}
                  >
                    {row.reference?.trim() || t("pages.driverLoans.viewLoan")}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
