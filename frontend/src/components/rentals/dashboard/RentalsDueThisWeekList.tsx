import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RentalDueThisWeekRow } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { btnSecondary } from "../../../theme/classNames";
import { formatShortDateRange } from "./rentalDashboardUtils";
import { rentPaymentStateClass, rentPaymentStateLabel } from "../rentalStatus";

type RentalsDueThisWeekListProps = {
  items?: RentalDueThisWeekRow[];
  loading?: boolean;
  className?: string;
  onRenew?: (bookingId: string) => void;
};

export function RentalsDueThisWeekList({
  items,
  loading,
  className = "",
  onRenew,
}: RentalsDueThisWeekListProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <section className={`fm-rental-dashboard__card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}>
        <div className="fm-rental-dashboard__skeleton h-40" />
      </section>
    );
  }

  const rows = items ?? [];

  return (
    <section
      className={`fm-rental-dashboard__card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}
    >
      <h2 className="text-base font-semibold text-ink">{t("pages.rentalDashboard.dueThisWeekTitle")}</h2>
      <p className="mt-1 text-sm text-slate-500">{t("pages.rentalDashboard.dueThisWeekHint")}</p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{t("pages.rentalDashboard.noWeeklyDue")}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((b) => {
            const overdue = new Date(b.end_at).getTime() < Date.now();
            return (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {b.customer_name} · {b.license_plate}
                  </p>
                  <p className="text-xs text-slate-600">
                    {formatShortDateRange(b.start_at, b.end_at)}
                    {overdue ? ` ${t("pages.rentalDashboard.overdueSuffix")}` : ""}
                  </p>
                  <p className={`text-xs font-medium ${rentPaymentStateClass(b.rent_payment_state)}`}>
                    {rentPaymentStateLabel(b.rent_payment_state)} · {formatCurrency(Number(b.total_amount))}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {onRenew && b.status === "active" && b.rental_type === "weekly" && (
                    <button type="button" className={`${btnSecondary} !text-xs`} onClick={() => onRenew(b.id)}>
                      {t("pages.rentalDashboard.renew")}
                    </button>
                  )}
                  <Link to={`/rentals/bookings/${b.id}`} className={`${btnSecondary} !text-xs`}>
                    {t("common.view")}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
