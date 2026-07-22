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
  canManage?: boolean;
  onBlockDates: (vehicleId: string) => void;
  onViewCalendar: (vehicleId: string) => void;
  onQuickWeekly?: (vehicleId: string) => void;
};

export function AvailabilityVehicleList({
  vehicles,
  bookings,
  blocks,
  from,
  to,
  loading,
  canManage = false,
  onBlockDates,
  onViewCalendar,
  onQuickWeekly,
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
    return <AvailabilityEmptyState canManage={canManage} />;
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
          canManage={canManage}
          onBlockDates={onBlockDates}
          onViewCalendar={onViewCalendar}
          onQuickWeekly={onQuickWeekly}
        />
      ))}
    </div>
  );
}
