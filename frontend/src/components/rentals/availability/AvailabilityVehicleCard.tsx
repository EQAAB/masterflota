import { Link } from "react-router-dom";
import type {
  RentalAvailabilityBlock,
  RentalAvailabilityBooking,
  RentalAvailabilityVehicle,
} from "../../../api/rentals";
import {
  vehicleAvailabilityStatusClass,
  vehicleAvailabilityStatusLabel,
} from "../rentalStatus";
import { AvailabilityMiniTimeline } from "./AvailabilityMiniTimeline";
import {
  availabilityPct,
  buildDaySegments,
  countSegmentStates,
  deriveVehicleDisplayStatus,
  summarizePeriodText,
} from "./availabilityListUtils";

type AvailabilityVehicleCardProps = {
  vehicle: RentalAvailabilityVehicle;
  bookings: RentalAvailabilityBooking[];
  blocks: RentalAvailabilityBlock[];
  from: string;
  to: string;
  canManage?: boolean;
  onBlockDates: (vehicleId: string) => void;
  onViewCalendar: (vehicleId: string) => void;
  onQuickWeekly?: (vehicleId: string) => void;
};

export function AvailabilityVehicleCard({
  vehicle,
  bookings,
  blocks,
  from,
  to,
  canManage = false,
  onBlockDates,
  onViewCalendar,
  onQuickWeekly,
}: AvailabilityVehicleCardProps) {
  const segments = buildDaySegments(vehicle, bookings, blocks, from, to);
  const displayStatus = deriveVehicleDisplayStatus(vehicle, segments, bookings);
  const counts = countSegmentStates(segments);
  const pct = availabilityPct(segments);
  const meta = [vehicle.vehicle_type, vehicle.transmission].filter(Boolean).join(" · ");

  return (
    <article className="fm-rental-availability__vehicle-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 gap-4 lg:w-[220px] lg:shrink-0">
          <div className="fm-rental-availability__thumb">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H4m10 0h2m-2 0l-2-2m2 2l-2 2" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-mono text-sm font-bold text-ink">{vehicle.license_plate}</p>
            <p className="truncate text-sm font-medium text-ink">
              {vehicle.make} {vehicle.model}
            </p>
            {meta ? <p className="text-xs capitalize text-slate-500">{meta}</p> : null}
            <span className={`mt-2 inline-flex ${vehicleAvailabilityStatusClass(displayStatus)}`}>
              {vehicleAvailabilityStatusLabel(displayStatus)}
            </span>
            {vehicle.driver_assigned ? (
              <p className="mt-1 text-xs text-amber-700">Driver assigned — check conflicts</p>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Availability</p>
          <AvailabilityMiniTimeline segments={segments} />
          <p className="mt-2 text-xs text-slate-600">{summarizePeriodText(segments)}</p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 lg:w-[140px] lg:items-end">
          <div className="text-left lg:text-right">
            <p className="text-2xl font-bold tabular-nums text-ink">{pct}%</p>
            <p className="text-xs text-slate-500">Available</p>
            <p className="mt-1 text-xs text-slate-600">
              {counts.booked} booked · {counts.blocked} blocked
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className="rounded-lg border border-border/80 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-muted shadow-sm hover:bg-slate-50 hover:text-ink"
              onClick={() => onViewCalendar(vehicle.id)}
            >
              Calendar
            </button>
            {canManage ? (
              <>
                <button
                  type="button"
                  className="rounded-lg border border-border/80 bg-white px-2.5 py-1.5 text-xs font-medium text-brand shadow-sm hover:bg-brand-mint/30"
                  onClick={() => onQuickWeekly?.(vehicle.id)}
                >
                  Book
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-border/80 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-muted shadow-sm hover:bg-slate-50"
                  onClick={() => onBlockDates(vehicle.id)}
                >
                  Block
                </button>
              </>
            ) : null}
            <Link
              to={`/vehicles/${vehicle.id}`}
              className="rounded-lg border border-border/80 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-muted shadow-sm hover:bg-slate-50"
            >
              Vehicle
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
