import { Link } from "react-router-dom";
import type { DriverListItem } from "../../api/drivers";
import {
  driverHasAssignedVehicle,
  formatDriverVehicleLabel,
  formatDriverVehiclePlate,
  getDriverVehicleLinkId,
} from "../../utils/driverVehicleDisplay";

export function DriverVehicleCell({ driver }: { driver: DriverListItem }) {
  if (!driverHasAssignedVehicle(driver)) {
    return <span className="text-sm text-ink-muted">—</span>;
  }

  const vehicleId = getDriverVehicleLinkId(driver);
  const label = formatDriverVehicleLabel(driver);
  const plate = formatDriverVehiclePlate(driver);

  if (!label) {
    return <span className="text-sm text-ink-muted">—</span>;
  }

  const content = (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-ink">{label}</p>
      {plate && <p className="truncate text-xs text-ink-muted tabular-nums">{plate}</p>}
    </div>
  );

  if (vehicleId) {
    return (
      <Link to={`/vehicles/${vehicleId}`} className="block min-w-0 hover:text-brand">
        {content}
      </Link>
    );
  }

  return content;
}
