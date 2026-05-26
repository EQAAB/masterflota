import { Link } from "react-router-dom";
import type { VehicleListItem } from "../../api/vehicles";
import { formatVehicleDisplayName, formatVehicleTypeLabel } from "../../utils/vehicleTypeDisplay";
import { VehicleTypeIcon } from "./VehicleTypeIcon";

export function VehicleNameCell({ vehicle }: { vehicle: VehicleListItem }) {
  const name = formatVehicleDisplayName(vehicle);
  const typeLabel = formatVehicleTypeLabel(vehicle.vehicle_type);

  return (
    <Link to={`/vehicles/${vehicle.id}`} className="group flex min-w-0 items-center gap-3">
      <VehicleTypeIcon vehicleType={vehicle.vehicle_type} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink group-hover:text-brand">{name}</p>
        <p className="truncate text-xs text-ink-muted">{typeLabel}</p>
      </div>
    </Link>
  );
}
