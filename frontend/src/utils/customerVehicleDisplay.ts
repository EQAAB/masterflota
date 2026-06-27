import type { RentalCustomer } from "../api/rentals";

export type CustomerVehicleSnapshot = Pick<
  RentalCustomer,
  | "current_vehicle_id"
  | "current_vehicle_license_plate"
  | "current_vehicle_make"
  | "current_vehicle_model"
  | "extra_active_vehicles"
>;

export function customerHasActiveVehicle(customer: CustomerVehicleSnapshot): boolean {
  if (customer.current_vehicle_id?.trim()) return true;
  return Boolean(
    customer.current_vehicle_make?.trim() ||
      customer.current_vehicle_model?.trim() ||
      customer.current_vehicle_license_plate?.trim(),
  );
}

export function getCustomerVehicleLinkId(customer: CustomerVehicleSnapshot): string | null {
  return customer.current_vehicle_id?.trim() || null;
}

function makeModelFromCustomer(customer: CustomerVehicleSnapshot): string {
  return `${customer.current_vehicle_make ?? ""} ${customer.current_vehicle_model ?? ""}`.trim();
}

function plateFromCustomer(customer: CustomerVehicleSnapshot): string | null {
  const plate = customer.current_vehicle_license_plate;
  return plate?.trim() ? plate.trim() : null;
}

/** Primary display label: make/model, else license plate; null if no active rental vehicle. */
export function formatCustomerVehicleLabel(customer: CustomerVehicleSnapshot): string | null {
  if (!customerHasActiveVehicle(customer)) return null;
  const makeModel = makeModelFromCustomer(customer);
  if (makeModel) return makeModel;
  return plateFromCustomer(customer);
}

/** Plate for secondary line when both name and plate are available. */
export function formatCustomerVehiclePlate(customer: CustomerVehicleSnapshot): string | null {
  if (!customerHasActiveVehicle(customer)) return null;
  const makeModel = makeModelFromCustomer(customer);
  const plate = plateFromCustomer(customer);
  if (makeModel && plate) return plate;
  return null;
}

/** "+N more" when customer has multiple active rental vehicles. */
export function formatCustomerVehicleExtra(customer: CustomerVehicleSnapshot): string | null {
  const extra = customer.extra_active_vehicles ?? 0;
  if (extra <= 0) return null;
  return `+${extra} more`;
}
