import { Link } from "react-router-dom";
import type { RentalAvailabilityBooking } from "../../../api/rentals";
import { bookingStatusClass, bookingStatusDisplayLabel } from "../rentalStatus";
import { formatEventDateRange, groupBookingsByDay } from "./calendarUtils";
import { formatCurrency } from "../../../utils/currency";

type CalendarListViewProps = {
  bookings: RentalAvailabilityBooking[];
  loading?: boolean;
  onSelectBooking: (b: RentalAvailabilityBooking) => void;
};

export function CalendarListView({ bookings, loading, onSelectBooking }: CalendarListViewProps) {
  if (loading) {
    return (
      <div className="fm-rental-calendar__grid-card space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="fm-rental-calendar__skeleton h-20" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="fm-rental-calendar__grid-card px-6 py-16 text-center">
        <p className="text-sm text-ink-muted">No bookings in this period.</p>
        <Link to="/rentals/bookings/new" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
          Create a booking
        </Link>
      </div>
    );
  }

  const grouped = groupBookingsByDay(bookings);

  return (
    <div className="fm-rental-calendar__grid-card divide-y divide-slate-100">
      {[...grouped.entries()].map(([day, list]) => (
        <section key={day} className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink">
            {new Date(day + "T12:00:00").toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h3>
          <ul className="space-y-2">
            {list.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-left transition-colors hover:border-brand/30 hover:bg-white"
                  onClick={() => onSelectBooking(b)}
                >
                  <div>
                    <p className="font-semibold text-brand">{b.booking_number}</p>
                    <p className="text-sm text-ink">
                      {b.customer_name} · {b.license_plate}
                    </p>
                    <p className="text-xs text-slate-500">{formatEventDateRange(b.start_at, b.end_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums">{formatCurrency(Number(b.total_amount))}</span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${bookingStatusClass(b.status)}`}
                    >
                      {bookingStatusDisplayLabel(b.status)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
