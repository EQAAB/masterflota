import type { RentalAvailabilityBooking } from "../../../api/rentals";
import { buildMonthCells } from "./calendarUtils";
import { CalendarDayCell } from "./CalendarDayCell";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarMonthGridProps = {
  cursorDate: Date;
  bookings: RentalAvailabilityBooking[];
  loading?: boolean;
  onSelectBooking: (b: RentalAvailabilityBooking) => void;
};

export function CalendarMonthGrid({ cursorDate, bookings, loading, onSelectBooking }: CalendarMonthGridProps) {
  const cells = buildMonthCells(cursorDate);

  if (loading) {
    return (
      <div className="fm-rental-calendar__grid-card p-4">
        <div className="fm-rental-calendar__skeleton h-[480px]" />
      </div>
    );
  }

  return (
    <div className="fm-rental-calendar__grid-card">
      <div className="fm-rental-calendar__grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="fm-rental-calendar__weekday">
            {d}
          </div>
        ))}
        {cells.map((cell) => (
          <CalendarDayCell
            key={cell.dateKey}
            date={cell.date}
            dateKey={cell.dateKey}
            inMonth={cell.inMonth}
            bookings={bookings}
            onSelectBooking={onSelectBooking}
          />
        ))}
      </div>
    </div>
  );
}
