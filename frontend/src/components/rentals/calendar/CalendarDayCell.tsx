import { Link } from "react-router-dom";
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
};

export function CalendarDayCell({ date, dateKey, inMonth, bookings, onSelectBooking }: CalendarDayCellProps) {
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
          <Link
            to={`/rentals/bookings/new?startAt=${dateKey}T09:00`}
            className="fm-rental-calendar__cell-add"
            title="Add booking"
            onClick={(e) => e.stopPropagation()}
          >
            +
          </Link>
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
