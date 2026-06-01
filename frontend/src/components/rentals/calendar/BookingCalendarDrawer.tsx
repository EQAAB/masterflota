import { Link } from "react-router-dom";
import type { RentalAvailabilityBooking } from "../../../api/rentals";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";
import { formatCurrency } from "../../../utils/currency";
import { bookingStatusClass, bookingStatusDisplayLabel } from "../rentalStatus";
import { formatEventDateRange } from "./calendarUtils";

type BookingCalendarDrawerProps = {
  booking: RentalAvailabilityBooking | null;
  onClose: () => void;
};

export function BookingCalendarDrawer({ booking, onClose }: BookingCalendarDrawerProps) {
  if (!booking) return null;

  const vehicle = [booking.make, booking.model].filter(Boolean).join(" ");

  return (
    <>
      <button type="button" className="fm-rental-calendar__drawer-backdrop" aria-label="Close" onClick={onClose} />
      <div className="fm-rental-calendar__drawer" role="dialog" aria-modal="true" aria-labelledby="calendar-drawer-title">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <h2 id="calendar-drawer-title" className="text-lg font-semibold text-ink">
            {booking.booking_number}
          </h2>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${bookingStatusClass(booking.status)}`}
          >
            {bookingStatusDisplayLabel(booking.status)}
          </span>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Customer</dt>
              <dd className="mt-0.5 font-medium text-ink">{booking.customer_name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Vehicle</dt>
              <dd className="mt-0.5">
                <span className="fm-rental-bookings__plate-badge">{booking.license_plate}</span>
                {vehicle && <span className="ml-2 text-ink">{vehicle}</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Period</dt>
              <dd className="mt-0.5 text-ink">{formatEventDateRange(booking.start_at, booking.end_at)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Total</dt>
              <dd className="mt-0.5 text-xl font-bold tabular-nums text-ink">
                {formatCurrency(Number(booking.total_amount))}
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border/70 p-5">
          <Link to={`/rentals/bookings/${booking.id}`} className={`${btnPrimary} flex-1 text-center`} onClick={onClose}>
            View booking
          </Link>
          {booking.status === "draft" && (
            <Link
              to={`/rentals/bookings/${booking.id}/edit`}
              className={`${btnSecondary} flex-1 text-center`}
              onClick={onClose}
            >
              Edit
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
