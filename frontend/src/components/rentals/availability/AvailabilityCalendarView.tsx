import { useTranslation } from "react-i18next";
import type {
  RentalAvailabilityBlock,
  RentalAvailabilityBooking,
  RentalAvailabilityVehicle,
} from "../../../api/rentals";
import { AvailabilityEmptyState } from "./AvailabilityEmptyState";
import { buildDaySegments, dateRangeDays } from "./availabilityListUtils";

const SEG_BG: Record<string, string> = {
  available: "bg-emerald-500",
  booked: "bg-rose-500",
  blocked: "bg-slate-400",
  maintenance: "bg-amber-500",
};

type AvailabilityCalendarViewProps = {
  vehicles: RentalAvailabilityVehicle[];
  bookings: RentalAvailabilityBooking[];
  blocks: RentalAvailabilityBlock[];
  from: string;
  to: string;
  loading?: boolean;
  focusVehicleId?: string;
};

export function AvailabilityCalendarView({
  vehicles,
  bookings,
  blocks,
  from,
  to,
  loading,
  focusVehicleId,
}: AvailabilityCalendarViewProps) {
  const { t } = useTranslation();
  const days = dateRangeDays(from, to);
  const showDays = days.length > 31 ? days.slice(0, 31) : days;
  const list = focusVehicleId ? vehicles.filter((v) => v.id === focusVehicleId) : vehicles;

  if (loading) {
    return <div className="fm-rental-availability__skeleton h-64" />;
  }

  if (list.length === 0) {
    return <AvailabilityEmptyState />;
  }

  return (
    <div className="fm-rental-availability__calendar-grid">
      <div className="min-w-[640px]">
        <div className="fm-rental-availability__calendar-row border-b border-slate-200 bg-slate-50/90">
          <div className="w-36 shrink-0 px-3 py-2 text-xs font-semibold text-slate-500">{t("pages.rentalCalendar.vehicleLabel")}</div>
          <div className="flex flex-1">
            {showDays.map((d) => (
              <div
                key={d}
                className="fm-rental-availability__calendar-cell flex w-8 items-center justify-center text-[9px] text-slate-400"
                title={d}
              >
                {new Date(`${d}T12:00:00.000Z`).getUTCDate()}
              </div>
            ))}
          </div>
        </div>
        {list.map((v) => {
          const segments = buildDaySegments(v, bookings, blocks, from, to).filter((s) =>
            showDays.includes(s.date),
          );
          return (
            <div key={v.id} className="fm-rental-availability__calendar-row">
              <div className="flex w-36 shrink-0 items-center px-3 py-2">
                <span className="truncate font-mono text-xs font-semibold">{v.license_plate}</span>
              </div>
              <div className="flex flex-1 items-center py-1.5">
                {segments.map((seg) => (
                  <div
                    key={seg.date}
                    className={`fm-rental-availability__calendar-cell ${SEG_BG[seg.state] ?? "bg-slate-200"}`}
                    title={`${seg.date}: ${seg.state}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {days.length > 31 && (
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
          {t("pages.availability.showingFirst31Days")}
        </p>
      )}
    </div>
  );
}
