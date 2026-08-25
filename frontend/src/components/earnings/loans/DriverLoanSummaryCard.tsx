import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getActiveDriverLoan } from "../../../api/driverLoans";
import { formatCurrency } from "../../../utils/currency";
import { driverLoanDisplayName } from "./loansReportDisplay";

type DriverLoanSummaryCardProps = {
  driverId: string;
  driverFirstName?: string;
  driverLastName?: string;
};

export function DriverLoanSummaryCard({
  driverId,
  driverFirstName,
  driverLastName,
}: DriverLoanSummaryCardProps) {
  const { t } = useTranslation();
  const q = useQuery({
    queryKey: ["driver-loan-active", driverId],
    queryFn: () => getActiveDriverLoan(driverId).then((r) => r.data.loan),
    enabled: !!driverId,
  });

  const loan = q.data;
  const hasActive =
    loan && loan.status === "active" && Number(loan.remaining_balance) > 0.02;

  const searchName =
    driverFirstName && driverLastName
      ? driverLoanDisplayName(driverFirstName, driverLastName)
      : undefined;

  return (
    <section className="rounded-[16px] border border-border/70 bg-white p-4 shadow-soft sm:p-5">
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-ink">{t("pages.driverDetail.loansTitle")}</h2>
        <p className="text-xs text-ink-muted mt-0.5">
          {t("pages.driverDetail.loansDesc")}
        </p>
      </div>

      {q.isLoading && <p className="text-sm text-ink-muted">{t("common.loading")}</p>}
      {q.isError && <p className="text-sm text-red-700">{t("pages.driverDetail.failedToLoadLoanInfo")}</p>}

      {!q.isLoading && !q.isError && (
        <>
          {hasActive && loan ? (
            <div className="rounded-xl border border-sky-200/70 bg-sky-50/40 px-3 py-3 text-sm">
              <p className="text-sky-900">
                {t("pages.driverDetail.activeLoanPrefix")}{" "}
                <span className="font-semibold tabular-nums">
                  {formatCurrency(Number(loan.remaining_balance))}
                </span>{" "}
                {t("pages.driverDetail.remainingOfSuffix", { principal: formatCurrency(Number(loan.principal)) })}
              </p>
              {loan.planned_repayment_week && (
                <p className="text-xs text-sky-800 mt-1">
                  {t("pages.driverDetail.plannedWeekPrefix", { date: loan.planned_repayment_week.slice(0, 10) })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">{t("pages.driverDetail.noActiveLoanForDriver")}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {hasActive && loan && (
              <Link
                to={`/earnings/loans/${loan.id}`}
                className="font-medium text-brand hover:underline"
              >
                {t("pages.driverDetail.viewLoanLink")}
              </Link>
            )}
            <Link
              to={
                searchName
                  ? `/earnings/loans?search=${encodeURIComponent(searchName)}`
                  : "/earnings/loans"
              }
              className="font-medium text-brand hover:underline"
            >
              {t("pages.driverDetail.allDriverLoansLink")}
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
