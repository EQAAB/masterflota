import { describe, expect, it } from "vitest";
import {
  normalizePlatformIdValue,
  platformIdConflictMessage,
  platformIdsForTerminatedWrite,
  type PlatformIdConflict,
} from "./platformIds";

describe("normalizePlatformIdValue", () => {
  it("trims and rejects empty", () => {
    expect(normalizePlatformIdValue("glovo_courier_id", "  abc  ")).toBe("abc");
    expect(normalizePlatformIdValue("glovo_courier_id", "   ")).toBeNull();
    expect(normalizePlatformIdValue("uber_driver_id", null)).toBeNull();
  });

  it("validates bolt taxi UUID", () => {
    expect(
      normalizePlatformIdValue("bolt_taxi_driver_uuid", "550e8400-e29b-41d4-a716-446655440000"),
    ).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(normalizePlatformIdValue("bolt_taxi_driver_uuid", "not-a-uuid")).toBeNull();
  });
});

describe("platformIdsForTerminatedWrite", () => {
  it("clears all platform IDs when employment is terminated", () => {
    expect(
      platformIdsForTerminatedWrite("terminated", {
        uber_driver_id: "u1",
        glovo_courier_id: "g1",
      }),
    ).toEqual({
      uber_driver_id: null,
      bolt_driver_id: null,
      glovo_courier_id: null,
      bolt_courier_id: null,
      bolt_taxi_driver_uuid: null,
      wolt_courier_id: null,
    });
  });

  it("keeps normalized IDs for active drivers", () => {
    expect(
      platformIdsForTerminatedWrite("active", {
        uber_driver_id: " U1 ",
        glovo_courier_id: "",
      }),
    ).toMatchObject({
      uber_driver_id: "U1",
      glovo_courier_id: null,
    });
  });
});

describe("platformIdConflictMessage", () => {
  it("includes label and value", () => {
    const conflict: PlatformIdConflict = {
      field: "glovo_courier_id",
      label: "Glovo courier ID",
      value: "abc",
      existingDriverId: "d1",
    };
    expect(platformIdConflictMessage(conflict)).toContain("Glovo courier ID");
    expect(platformIdConflictMessage(conflict)).toContain("abc");
  });
});
