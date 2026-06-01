import type { RentalAvailabilityBooking } from "../../../api/rentals";
import { bookingsForDay, buildWeekDays, toDateKey } from "./calendarUtils";
import { CalendarEventCard } from "./CalendarEventCard";

type CalendarWeekGridProps = {
  cursorDate: Date;
  bookings: RentalAvailabilityBooking[];
  loading?: boolean;
  onSelectBooking: (b: RentalAvailabilityBooking) => void;
};

export function CalendarWeekGrid({ cursorDate, bookings, loading, onSelectBooking }: CalendarWeekGridProps) {
  const days = buildWeekDays(cursorDate);
  const todayKey = toDateKey(new Date());

  if (loading) {
    return (
      <div className="fm-rental-calendar__grid-card p-4">
        <div className="fm-rental-calendar__skeleton h-64" />
      </div>
    );
  }

  return (
    <div className="fm-rental-calendar__grid-card overflow-x-auto">
      <div className="grid min-w-[700px] grid-cols-7">
        {days.map((d) => {
          const key = toDateKey(d);
          const dayBookings = bookingsForDay(bookings, key);
          return (
            <div
              key={key}
              className={`fm-rental-calendar__week-col ${key === todayKey ? "bg-brand-mint/15" : ""}`}
            >
              <p className="mb-2 text-center text-xs font-semibold text-slate-600">
                {d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}
              </p>
              <div className="space-y-1">
                {dayBookings.map((b) => (
                  <CalendarEventCard key={b.id} booking={b} onClick={() => onSelectBooking(b)} />
                ))}
                {dayBookings.length === 0 && (
                  <p className="py-4 text-center text-[10px] text-slate-400">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
