import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RentalDashboardPaymentRow } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { RentalDashboardCard } from "./RentalDashboardCard";
import { initialsFromName } from "./rentalDashboardUtils";
import { paymentStatusLabel } from "../rentalStatus";
import i18n from "../../../i18n";

type UpcomingPaymentsListProps = {
  payments?: RentalDashboardPaymentRow[];
  loading?: boolean;
  className?: string;
};

function formatDue(due: string | null): string {
  if (!due) return i18n.t("common.emDash");
  try {
    const locale = i18n.language?.startsWith("ro") ? "ro-RO" : "en-GB";
    return new Date(due).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return due.slice(0, 10);
  }
}

export function UpcomingPaymentsList({ payments = [], loading, className }: UpcomingPaymentsListProps) {
  const { t } = useTranslation();
  return (
    <RentalDashboardCard title={t("pages.rentalDashboard.upcomingPaymentsTitle")} viewAllTo="/rentals/payments" className={className}>
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="fm-rental-dashboard__skeleton h-14" />
          ))}
        </div>
      )}
      {!loading && payments.length === 0 && (
        <p className="py-6 text-center text-sm text-ink-muted">{t("pages.rentalDashboard.noPendingPayments")}</p>
      )}
      {!loading && payments.length > 0 && (
        <ul className="space-y-1">
          {payments.map((p) => (
            <li key={p.id}>
              <Link to={`/rentals/bookings/${p.booking_id}`} className="fm-rental-dashboard__row group">
                <span className="fm-rental-dashboard__avatar bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/60">
                  {initialsFromName(p.customer_name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{p.customer_name}</span>
                  <span className="block text-xs text-ink-muted">
                    {t("pages.rentalDashboard.dueOn", { date: formatDue(p.due_at) })} · {p.booking_number}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums text-emerald-800">
                    {formatCurrency(Number(p.amount))}
                  </span>
                  <span className="block text-[10px] text-slate-500">{paymentStatusLabel(p.status)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </RentalDashboardCard>
  );
}
