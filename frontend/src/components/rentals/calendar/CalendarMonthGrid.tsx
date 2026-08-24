import { useTranslation } from "react-i18next";
import type { RentalAvailabilityBooking } from "../../../api/rentals";
import { buildMonthCells } from "./calendarUtils";
import { CalendarDayCell } from "./CalendarDayCell";

const WEEKDAY_KEYS = ["weekdayMon", "weekdayTue", "weekdayWed", "weekdayThu", "weekdayFri", "weekdaySat", "weekdaySun"] as const;

type CalendarMonthGridProps = {
  cursorDate: Date;
  bookings: RentalAvailabilityBooking[];
  loading?: boolean;
  onSelectBooking: (b: RentalAvailabilityBooking) => void;
  onQuickBook?: (startAt: string) => void;
};

export function CalendarMonthGrid({
  cursorDate,
  bookings,
  loading,
  onSelectBooking,
  onQuickBook,
}: CalendarMonthGridProps) {
  const { t } = useTranslation();
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
        {WEEKDAY_KEYS.map((key) => (
          <div key={key} className="fm-rental-calendar__weekday">
            {t(`pages.rentalDashboard.${key}`)}
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
            onQuickBook={onQuickBook}
          />
        ))}
      </div>
    </div>
  );
}
