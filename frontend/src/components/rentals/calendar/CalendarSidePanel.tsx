import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RentalAvailabilityBooking, RentalDashboard } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { bookingStatusDisplayLabel } from "../rentalStatus";
import { todaysReturns, upcomingPickups } from "./calendarUtils";
import i18n from "../../../i18n";

type CalendarSidePanelProps = {
  bookings: RentalAvailabilityBooking[];
  dashboard?: RentalDashboard;
};

export function CalendarSidePanel({ bookings, dashboard }: CalendarSidePanelProps) {
  const { t } = useTranslation();
  const pickups = upcomingPickups(bookings);
  const returns = todaysReturns(bookings);
  const pending = dashboard?.upcoming_payments ?? [];

  return (
    <aside className="fm-rental-calendar__side-panel">
      <section>
        <h3 className="text-sm font-semibold text-ink">{t("pages.rentalCalendar.upcomingPickupsTitle")}</h3>
        <ul className="mt-2 space-y-2">
          {pickups.length === 0 && <li className="text-xs text-slate-500">{t("pages.rentalCalendar.noneInNext7Days")}</li>}
          {pickups.map((b) => (
            <li key={b.id}>
              <Link to={`/rentals/bookings/${b.id}`} className="fm-rental-calendar__side-item block">
                <p className="font-medium text-ink">{b.customer_name}</p>
                <p className="text-xs text-slate-500">
                  {b.license_plate} · {new Date(b.start_at).toLocaleString(i18n.language?.startsWith("ro") ? "ro-RO" : "en-GB", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-ink">{t("pages.rentalCalendar.todaysReturnsTitle")}</h3>
        <ul className="mt-2 space-y-2">
          {returns.length === 0 && <li className="text-xs text-slate-500">{t("pages.rentalCalendar.noReturnsToday")}</li>}
          {returns.map((b) => (
            <li key={b.id}>
              <Link to={`/rentals/bookings/${b.id}`} className="fm-rental-calendar__side-item block">
                <p className="font-medium text-ink">{b.booking_number}</p>
                <p className="text-xs text-slate-500">
                  {b.customer_name} · {bookingStatusDisplayLabel(b.status)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-ink">{t("pages.rentalCalendar.pendingPaymentsTitle")}</h3>
        <ul className="mt-2 space-y-2">
          {pending.length === 0 && <li className="text-xs text-slate-500">{t("pages.rentalCalendar.allCaughtUp")}</li>}
          {pending.slice(0, 6).map((p) => (
            <li key={p.id}>
              <Link to={`/rentals/bookings/${p.booking_id}`} className="fm-rental-calendar__side-item block">
                <p className="font-medium text-ink">{p.customer_name}</p>
                <p className="text-xs text-emerald-800 tabular-nums">{formatCurrency(Number(p.amount))}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
