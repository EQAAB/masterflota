import type { RentalAvailabilityBooking } from "../../../api/rentals";
import { bookingsForDay, toDateKey } from "./calendarUtils";
import { CalendarEventCard } from "./CalendarEventCard";

const MAX_VISIBLE = 3;

type CalendarDayCellProps = {
  date: Date;
  dateKey: string;
  inMonth: boolean;
  bookings: RentalAvailabilityBooking[];
  onSelectBooking: (b: RentalAvailabilityBooking) => void;
  onQuickBook?: (dateKey: string) => void;
};

export function CalendarDayCell({
  date,
  dateKey,
  inMonth,
  bookings,
  onSelectBooking,
  onQuickBook,
}: CalendarDayCellProps) {
  const todayKey = toDateKey(new Date());
  const isToday = dateKey === todayKey;
  const dayBookings = bookingsForDay(bookings, dateKey);
  const visible = dayBookings.slice(0, MAX_VISIBLE);
  const more = dayBookings.length - visible.length;

  return (
    <div
      className={`fm-rental-calendar__cell ${isToday ? "fm-rental-calendar__cell--today" : ""} ${
        !inMonth ? "fm-rental-calendar__cell--outside" : ""
      }`}
    >
      <div className="fm-rental-calendar__cell-date">
        <span className={isToday ? "text-brand-dark" : ""}>{date.getDate()}</span>
        {inMonth && (
          <button
            type="button"
            className="fm-rental-calendar__cell-add"
            title="Quick weekly rental"
            onClick={(e) => {
              e.stopPropagation();
              onQuickBook?.(`${dateKey}T09:00`);
            }}
          >
            +
          </button>
        )}
      </div>
      <div className="space-y-0.5">
        {visible.map((b) => (
          <CalendarEventCard key={b.id} booking={b} compact onClick={() => onSelectBooking(b)} />
        ))}
        {more > 0 && (
          <p className="px-1 text-[10px] font-medium text-slate-500">+{more} more</p>
        )}
      </div>
    </div>
  );
}
