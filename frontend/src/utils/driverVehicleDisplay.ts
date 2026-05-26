import type { DriverListItem } from "../api/drivers";

export type DriverVehicleSnapshot = Pick<
  DriverListItem,
  "current_vehicle_id" | "current_vehicle_make" | "current_vehicle_model" | "current_vehicle_license_plate"
> & {
  vehicle?: DriverListItem["vehicle"];
};

export function driverHasAssignedVehicle(driver: DriverVehicleSnapshot): boolean {
  if (driver.current_vehicle_id?.trim()) return true;
  if (driver.vehicle?.id) return true;
  return Boolean(
    driver.current_vehicle_make?.trim() ||
      driver.current_vehicle_model?.trim() ||
      driver.current_vehicle_license_plate?.trim() ||
      driver.vehicle?.license_plate?.trim(),
  );
}

export function getDriverVehicleLinkId(driver: DriverVehicleSnapshot): string | null {
  return driver.current_vehicle_id ?? driver.vehicle?.id ?? null;
}

function makeModelFromDriver(driver: DriverVehicleSnapshot): string {
  if (driver.vehicle?.make || driver.vehicle?.model) {
    return `${driver.vehicle.make ?? ""} ${driver.vehicle.model ?? ""}`.trim();
  }
  return `${driver.current_vehicle_make ?? ""} ${driver.current_vehicle_model ?? ""}`.trim();
}

function plateFromDriver(driver: DriverVehicleSnapshot): string | null {
  const plate = driver.vehicle?.license_plate ?? driver.current_vehicle_license_plate;
  return plate?.trim() ? plate.trim() : null;
}

/** Primary display label: make/model, else license plate; null if unassigned. */
export function formatDriverVehicleLabel(driver: DriverVehicleSnapshot): string | null {
  if (!driverHasAssignedVehicle(driver)) return null;
  const makeModel = makeModelFromDriver(driver);
  if (makeModel) return makeModel;
  return plateFromDriver(driver);
}

/** Plate for secondary line when both name and plate are available. */
export function formatDriverVehiclePlate(driver: DriverVehicleSnapshot): string | null {
  if (!driverHasAssignedVehicle(driver)) return null;
  const makeModel = makeModelFromDriver(driver);
  const plate = plateFromDriver(driver);
  if (makeModel && plate) return plate;
  return null;
}
