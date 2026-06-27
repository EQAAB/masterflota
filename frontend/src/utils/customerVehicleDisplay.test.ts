import { describe, expect, it } from "vitest";
import {
  customerHasActiveVehicle,
  formatCustomerVehicleExtra,
  formatCustomerVehicleLabel,
  formatCustomerVehiclePlate,
} from "./customerVehicleDisplay";
import type { RentalCustomer } from "../api/rentals";

function customer(partial: Partial<RentalCustomer>): RentalCustomer {
  return {
    id: "c1",
    organization_id: "o1",
    customer_type: "individual",
    legal_name: "Test",
    contact_name: null,
    email: null,
    phone: null,
    tax_id: null,
    address: {},
    notes: null,
    is_active: true,
    ...partial,
  };
}

describe("customerVehicleDisplay", () => {
  it("returns false/null when no active vehicle", () => {
    const c = customer({});
    expect(customerHasActiveVehicle(c)).toBe(false);
    expect(formatCustomerVehicleLabel(c)).toBeNull();
    expect(formatCustomerVehiclePlate(c)).toBeNull();
    expect(formatCustomerVehicleExtra(c)).toBeNull();
  });

  it("formats single vehicle label and plate", () => {
    const c = customer({
      current_vehicle_id: "v1",
      current_vehicle_make: "Toyota",
      current_vehicle_model: "Corolla",
      current_vehicle_license_plate: "B 123 ABC",
      extra_active_vehicles: 0,
    });
    expect(customerHasActiveVehicle(c)).toBe(true);
    expect(formatCustomerVehicleLabel(c)).toBe("Toyota Corolla");
    expect(formatCustomerVehiclePlate(c)).toBe("B 123 ABC");
    expect(formatCustomerVehicleExtra(c)).toBeNull();
  });

  it("shows plate-only when make/model missing", () => {
    const c = customer({
      current_vehicle_id: "v1",
      current_vehicle_license_plate: "B 999 XYZ",
    });
    expect(formatCustomerVehicleLabel(c)).toBe("B 999 XYZ");
    expect(formatCustomerVehiclePlate(c)).toBeNull();
  });

  it("formats extra active vehicles count", () => {
    const c = customer({
      current_vehicle_id: "v1",
      current_vehicle_license_plate: "B 111",
      extra_active_vehicles: 2,
    });
    expect(formatCustomerVehicleExtra(c)).toBe("+2 more");
  });
});
