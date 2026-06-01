import type { RentalAvailabilityBooking } from "../../../api/rentals";
import { bookingEventStatusClass, bookingStatusDisplayLabel } from "../rentalStatus";
import { formatEventDateRange } from "./calendarUtils";

type CalendarEventCardProps = {
  booking: RentalAvailabilityBooking;
  compact?: boolean;
  onClick: () => void;
};

export function CalendarEventCard({ booking: b, compact, onClick }: CalendarEventCardProps) {
  const vehicle = [b.make, b.model].filter(Boolean).join(" ") || b.license_plate;

  return (
    <button type="button" className={bookingEventStatusClass(b.status)} onClick={onClick}>
      <span className="block font-semibold">{b.booking_number}</span>
      <span className="block truncate opacity-90">{b.customer_name}</span>
      {!compact && vehicle && <span className="block truncate text-[10px] opacity-80">{vehicle}</span>}
      <span className="mt-0.5 block text-[10px] opacity-75">{formatEventDateRange(b.start_at, b.end_at)}</span>
      {compact && (
        <span className="mt-0.5 inline-block rounded px-1 text-[9px] font-semibold uppercase opacity-80">
          {bookingStatusDisplayLabel(b.status)}
        </span>
      )}
    </button>
  );
}
