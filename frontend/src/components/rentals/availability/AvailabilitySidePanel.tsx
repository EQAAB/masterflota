import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type {
  RentalAvailabilityBooking,
  RentalAvailabilityVehicle,
} from "../../../api/rentals";
import { formatShortDateRange } from "../dashboard/rentalDashboardUtils";
import i18n from "../../../i18n";

type AvailabilitySidePanelProps = {
  bookings: RentalAvailabilityBooking[];
  vehicles: RentalAvailabilityVehicle[];
  className?: string;
};

function formatSoon(iso: string): string {
  const d = new Date(iso);
  const locale = i18n.language?.startsWith("ro") ? "ro-RO" : undefined;
  return d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
}

export function AvailabilitySidePanel({ bookings, vehicles, className = "" }: AvailabilitySidePanelProps) {
  const { t } = useTranslation();
  const now = Date.now();
  const in7d = now + 7 * 24 * 60 * 60 * 1000;

  const pickups = bookings
    .filter(
      (b) =>
        b.status === "confirmed" &&
        new Date(b.start_at).getTime() >= now &&
        new Date(b.start_at).getTime() <= in7d,
    )
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
    .slice(0, 5);

  const returns = bookings
    .filter(
      (b) =>
        b.status === "active" &&
        new Date(b.end_at).getTime() >= now &&
        new Date(b.end_at).getTime() <= in7d,
    )
    .sort((a, b) => new Date(a.end_at).getTime() - new Date(b.end_at).getTime())
    .slice(0, 5);

  const maintenance = vehicles.filter((v) => v.status === "maintenance").slice(0, 5);

  const alerts = vehicles.filter((v) => v.driver_assigned).slice(0, 5);

  return (
    <aside className={`fm-rental-availability__side-panel ${className}`}>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("pages.rentalCalendar.upcomingPickupsTitle")}</h3>
        {pickups.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t("pages.rentalCalendar.noneInNext7Days")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {pickups.map((b) => (
              <li key={b.id}>
                <Link to={`/rentals/bookings/${b.id}`} className="fm-rental-availability__side-item block">
                  <p className="font-medium text-ink">{b.customer_name}</p>
                  <p className="text-xs text-slate-600">
                    {b.license_plate} · {formatSoon(b.start_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("pages.availability.upcomingReturnsTitle")}</h3>
        {returns.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t("pages.rentalCalendar.noneInNext7Days")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {returns.map((b) => (
              <li key={b.id}>
                <Link to={`/rentals/bookings/${b.id}`} className="fm-rental-availability__side-item block">
                  <p className="font-medium text-ink">{b.customer_name}</p>
                  <p className="text-xs text-slate-600">
                    {formatShortDateRange(b.start_at, b.end_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("pages.availability.inMaintenanceTitle")}</h3>
        {maintenance.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t("pages.availability.noVehiclesInMaintenance")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {maintenance.map((v) => (
              <li key={v.id}>
                <Link to={`/vehicles/${v.id}`} className="fm-rental-availability__side-item block">
                  <p className="font-medium text-ink">{v.license_plate}</p>
                  <p className="text-xs text-slate-600">
                    {v.make} {v.model}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {alerts.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-800">{t("pages.availability.availabilityAlertsTitle")}</h3>
          <ul className="mt-2 space-y-2">
            {alerts.map((v) => (
              <li key={v.id} className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm">
                <p className="font-medium text-amber-900">{v.license_plate}</p>
                <p className="text-xs text-amber-800">{t("pages.availability.driverAssignedConflict")}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
