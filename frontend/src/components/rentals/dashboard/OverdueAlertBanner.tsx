import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import type { RentalBooking } from "../../../api/rentals";

type OverdueAlertBannerProps = {
  count: number;
  items: RentalBooking[];
};

export function OverdueAlertBanner({ count, items }: OverdueAlertBannerProps) {
  const { t } = useTranslation();
  if (count <= 0) return null;

  return (
    <section className="fm-rental-dashboard__overdue mb-6" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-rose-900">{t("pages.rentalDashboard.overdueReturnsTitle")}</h2>
          <p className="mt-1 text-sm text-rose-800">
            <Trans i18nKey="pages.rentalDashboard.overdueReturnsBody" count={count} />
          </p>
        </div>
        <Link to="/rentals/bookings?status=active" className="text-sm font-medium text-rose-800 hover:underline">
          {t("pages.rentalDashboard.viewAll")} →
        </Link>
      </div>
      <ul className="mt-4 space-y-2">
        {items.slice(0, 5).map((b) => (
          <li
            key={b.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-rose-100/80 bg-white/90 px-3 py-2.5 text-sm shadow-sm"
          >
            <span className="font-medium text-ink">
              {b.booking_number} · {b.license_plate}
            </span>
            <Link to={`/rentals/bookings/${b.id}`} className="shrink-0 font-medium text-brand hover:underline">
              {b.rental_type === "weekly" ? t("pages.rentalDashboard.renewOrReturn") : t("pages.rentalDashboard.resolve")}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
