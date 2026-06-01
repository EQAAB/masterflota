import type {
  RentalAvailabilityBlock,
  RentalAvailabilityBooking,
  RentalAvailabilityVehicle,
} from "../../../api/rentals";
import { AvailabilityEmptyState } from "./AvailabilityEmptyState";
import { AvailabilityVehicleCard } from "./AvailabilityVehicleCard";

type AvailabilityVehicleListProps = {
  vehicles: RentalAvailabilityVehicle[];
  bookings: RentalAvailabilityBooking[];
  blocks: RentalAvailabilityBlock[];
  from: string;
  to: string;
  loading?: boolean;
  onBlockDates: (vehicleId: string) => void;
  onViewCalendar: (vehicleId: string) => void;
};

export function AvailabilityVehicleList({
  vehicles,
  bookings,
  blocks,
  from,
  to,
  loading,
  onBlockDates,
  onViewCalendar,
}: AvailabilityVehicleListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="fm-rental-availability__skeleton h-32" />
        ))}
      </div>
    );
  }

  if (vehicles.length === 0) {
    return <AvailabilityEmptyState />;
  }

  return (
    <div className="space-y-4">
      {vehicles.map((v) => (
        <AvailabilityVehicleCard
          key={v.id}
          vehicle={v}
          bookings={bookings}
          blocks={blocks}
          from={from}
          to={to}
          onBlockDates={onBlockDates}
          onViewCalendar={onViewCalendar}
        />
      ))}
    </div>
  );
}
