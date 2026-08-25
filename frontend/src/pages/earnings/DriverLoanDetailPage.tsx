import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getOrgLoan } from "../../api/driverLoans";
import { usePermission } from "../../lib/permissions";
import { PageHeader } from "../../components/theme/PageHeader";
import { LoanManageCard } from "../../components/earnings/loans/LoanManageCard";
import { LoanRepaymentList } from "../../components/earnings/loans/LoanRepaymentRow";
import { invalidateLoanQueries } from "../../components/earnings/loans/invalidateLoanQueries";
import { driverLoanDisplayName, loanStatusBadgeClass } from "../../components/earnings/loans/loansReportDisplay";
import { loanStatusLabel } from "../../api/driverLoans";

export function DriverLoanDetailPage() {
  const { t } = useTranslation();
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const canView = usePermission("drivers.view");
  const canEdit = usePermission("drivers.edit");

  const query = useQuery({
    queryKey: ["loan", loanId],
    queryFn: () => getOrgLoan(loanId!).then((r) => r.data.loan),
    enabled: canView && !!loanId,
  });

  const loan = query.data;

  const handleChanged = () => {
    invalidateLoanQueries(qc, { driverId: loan?.driver_id, loanId });
    void query.refetch();
  };

  if (!canView) {
    return <p className="p-6 text-ink-muted">{t("pages.driverLoans.noAccessLoans")}</p>;
  }

  if (query.isLoading) {
    return <p className="p-6 text-ink-muted">{t("pages.driverLoans.loadingLoan")}</p>;
  }

  if (query.isError || !loan) {
    return (
      <div className="p-6">
        <p className="text-danger">{t("pages.driverLoans.loanNotFound")}</p>
        <Link to="/earnings/loans" className="mt-2 inline-block text-sm text-brand hover:underline">
          {t("pages.driverLoans.backToDriverLoans")}
        </Link>
      </div>
    );
  }

  const driverName = driverLoanDisplayName(loan.driver_first_name, loan.driver_last_name);
  const title = loan.reference?.trim() || t("pages.driverLoans.cashLoanFallback");

  return (
    <div className="flex flex-col flex-1 overflow-auto bg-surface-elevated">
      <div className="shrink-0 border-b border-border/60 bg-surface-card/90 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <PageHeader
            title={title}
            description={t("pages.driverLoans.loanForDriverDescription", {
              name: driverName,
              phone: loan.driver_phone ? ` · ${loan.driver_phone}` : "",
            })}
            breadcrumbs={[
              { label: t("nav.dashboard"), to: "/dashboard" },
              { label: t("nav.earnings"), to: "/earnings" },
              { label: t("pages.driverLoans.driverLoansBreadcrumb"), to: "/earnings/loans" },
              { label: title },
            ]}
            className="border-0 bg-transparent px-0 py-4 sm:py-5"
            actions={
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/drivers/${loan.driver_id}`}
                  className="inline-flex h-10 items-center rounded-full border border-border/80 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  {t("pages.driverLoans.driverProfileLink")}
                </Link>
                <Link
                  to={`/earnings/payouts?driverId=${encodeURIComponent(loan.driver_id)}`}
                  className="inline-flex h-10 items-center rounded-full border border-border/80 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  {t("pages.driverLoans.repayFromPayout")}
                </Link>
              </div>
            }
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1600px] flex-1 space-y-4 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${loanStatusBadgeClass(loan.status)}`}
          >
            {loanStatusLabel(loan.status)}
          </span>
          <span className="text-sm text-ink-muted">{t("pages.driverLoans.disbursedLabel", { date: loan.disbursed_at })}</span>
        </div>

        <LoanManageCard
          loan={loan}
          driverId={loan.driver_id}
          canEdit={canEdit}
          onChanged={handleChanged}
        />

        <section>
          <h2 className="text-sm font-semibold text-ink mb-2">{t("pages.driverLoans.repaymentHistoryTitle")}</h2>
          <LoanRepaymentList repayments={loan.repayments ?? []} />
        </section>

        <button
          type="button"
          onClick={() => navigate("/earnings/loans")}
          className="text-sm text-brand hover:underline"
        >
          {t("pages.driverLoans.backToAllLoans")}
        </button>
      </div>
    </div>
  );
}
