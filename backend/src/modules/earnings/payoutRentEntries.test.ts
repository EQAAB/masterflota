import { describe, expect, it } from "vitest";
import { pickWeeklyFeeAnchorPlatform } from "./driverWeeklyFees";
import { shouldChargeVehicleRentOnPlatform } from "./payoutRentEntries";

describe("shouldChargeVehicleRentOnPlatform", () => {
  it("charges rent once on uber when uber + bolt share a week", () => {
    const platforms = ["uber", "bolt"];
    expect(shouldChargeVehicleRentOnPlatform("uber", platforms)).toBe(true);
    expect(shouldChargeVehicleRentOnPlatform("bolt", platforms)).toBe(false);
    expect(pickWeeklyFeeAnchorPlatform(platforms)).toBe("uber");
  });

  it("charges rent on glovo when glovo + uber + bolt share a week", () => {
    const platforms = ["bolt", "uber", "glovo"];
    expect(shouldChargeVehicleRentOnPlatform("glovo", platforms)).toBe(true);
    expect(shouldChargeVehicleRentOnPlatform("uber", platforms)).toBe(false);
    expect(shouldChargeVehicleRentOnPlatform("bolt", platforms)).toBe(false);
  });

  it("charges rent on bolt_taxi over bolt", () => {
    const platforms = ["bolt", "bolt_taxi"];
    expect(shouldChargeVehicleRentOnPlatform("bolt_taxi", platforms)).toBe(true);
    expect(shouldChargeVehicleRentOnPlatform("bolt", platforms)).toBe(false);
  });

  it("charges rent on sole platform", () => {
    expect(shouldChargeVehicleRentOnPlatform("bolt", ["bolt"])).toBe(true);
    expect(shouldChargeVehicleRentOnPlatform("uber", ["uber"])).toBe(true);
  });

  it("returns false for empty week", () => {
    expect(shouldChargeVehicleRentOnPlatform("uber", [])).toBe(false);
  });
});
