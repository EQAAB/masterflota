import { Link } from "react-router-dom";
import type { RentalDashboardBookingRow } from "../../../api/rentals";
import { bookingStatusClass, formatBookingStatus } from "../rentalStatus";
import { RentalDashboardCard } from "./RentalDashboardCard";
import { formatShortDateRange, initialsFromName } from "./rentalDashboardUtils";

type RecentBookingsListProps = {
  bookings?: RentalDashboardBookingRow[];
  loading?: boolean;
  className?: string;
};

export function RecentBookingsList({ bookings = [], loading, className }: RecentBookingsListProps) {
  return (
    <RentalDashboardCard title="Recent bookings" viewAllTo="/rentals/bookings" className={className}>
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="fm-rental-dashboard__skeleton h-14" />
          ))}
        </div>
      )}
      {!loading && bookings.length === 0 && (
        <p className="py-6 text-center text-sm text-ink-muted">No bookings yet. Create your first rental booking.</p>
      )}
      {!loading && bookings.length > 0 && (
        <ul className="space-y-1">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link to={`/rentals/bookings/${b.id}`} className="fm-rental-dashboard__row group">
                <span className="fm-rental-dashboard__avatar bg-brand-mint/90 text-brand-dark">
                  {initialsFromName(b.customer_name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink group-hover:text-brand">
                    {b.customer_name}
                  </span>
                  <span className="block truncate text-xs text-ink-muted">
                    {b.license_plate}
                    {b.make ? ` · ${b.make} ${b.model ?? ""}` : ""} · {formatShortDateRange(b.start_at, b.end_at)}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${bookingStatusClass(b.status)}`}
                >
                  {formatBookingStatus(b.status)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </RentalDashboardCard>
  );
}
