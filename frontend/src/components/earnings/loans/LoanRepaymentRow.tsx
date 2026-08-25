import { useTranslation } from "react-i18next";
import type { DriverLoanRepayment } from "../../../api/driverLoans";
import { loanRepaymentTypeLabel } from "../../../api/driverLoans";
import { formatCurrency } from "../../../utils/currency";

export function LoanRepaymentRow({ r }: { r: DriverLoanRepayment }) {
  const { t } = useTranslation();
  return (
    <li className="flex flex-wrap justify-between gap-2 border-b border-border/60 px-3 py-2.5 last:border-0 bg-white text-sm">
      <div>
        <span className="font-medium text-ink">{loanRepaymentTypeLabel(r.repayment_type)}</span>
        {r.payment_period_start && r.payment_period_end && (
          <span className="ml-2 text-xs text-ink-muted">
            {r.payment_period_start.slice(0, 10)} – {r.payment_period_end.slice(0, 10)}
          </span>
        )}
        <div className="text-ink tabular-nums mt-0.5">−{formatCurrency(Number(r.amount))}</div>
        <p className="text-xs text-ink-muted mt-0.5">
          {t("pages.driverLoans.balanceArrow", {
            before: formatCurrency(Number(r.balance_before)),
            after: formatCurrency(Number(r.balance_after)),
          })}
        </p>
        {r.notes && <p className="text-xs text-ink-muted">{r.notes}</p>}
      </div>
      <time className="text-xs text-ink-muted shrink-0">{r.created_at.slice(0, 10)}</time>
    </li>
  );
}

export function LoanRepaymentList({ repayments }: { repayments: DriverLoanRepayment[] }) {
  const { t } = useTranslation();
  if (repayments.length === 0) {
    return <p className="text-sm text-ink-muted px-3 py-4">{t("pages.driverLoans.noRepaymentsYet")}</p>;
  }
  return (
    <ul className="rounded-xl border border-border/70 overflow-hidden">
      {repayments.map((r) => (
        <LoanRepaymentRow key={r.id} r={r} />
      ))}
    </ul>
  );
}
