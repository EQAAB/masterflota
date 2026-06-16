import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveFleetStatus, syncVehicleFleetStatus } from "./vehicleFleetStatus";

const queryMock = vi.fn();

const ORG = "11111111-1111-4111-8111-111111111111";
const VEHICLE = "33333333-3333-4333-8333-333333333333";
const DRIVER = "44444444-4444-4444-8444-444444444444";

describe("resolveFleetStatus", () => {
  it("returns rented when driver is assigned", () => {
    expect(
      resolveFleetStatus({
        status: "available",
        currentDriverId: DRIVER,
        hasOpenRentalBooking: false,
      }),
    ).toBe("rented");
  });

  it("returns rented when a confirmed or active rental exists", () => {
    expect(
      resolveFleetStatus({
        status: "available",
        currentDriverId: null,
        hasOpenRentalBooking: true,
      }),
    ).toBe("rented");
  });

  it("returns available when no driver and no open rental", () => {
    expect(
      resolveFleetStatus({
        status: "rented",
        currentDriverId: null,
        hasOpenRentalBooking: false,
      }),
    ).toBe("available");
  });

  it("returns null for terminal statuses", () => {
    expect(
      resolveFleetStatus({
        status: "maintenance",
        currentDriverId: null,
        hasOpenRentalBooking: true,
      }),
    ).toBeNull();
    expect(
      resolveFleetStatus({
        status: "sold",
        currentDriverId: DRIVER,
        hasOpenRentalBooking: false,
      }),
    ).toBeNull();
  });
});

describe("syncVehicleFleetStatus", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("skips update for terminal vehicle status", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ status: "maintenance", current_driver_id: null }],
    });

    await syncVehicleFleetStatus({ query: queryMock }, ORG, VEHICLE);

    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("updates vehicle to rented when open rental exists", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ status: "available", current_driver_id: null }],
      })
      .mockResolvedValueOnce({ rows: [{ exists: true }] })
      .mockResolvedValueOnce({ rows: [] });

    await syncVehicleFleetStatus({ query: queryMock }, ORG, VEHICLE);

    expect(queryMock).toHaveBeenCalledTimes(3);
    expect(queryMock.mock.calls[2]?.[0]).toContain("UPDATE vehicles SET status");
    expect(queryMock.mock.calls[2]?.[1]).toEqual([VEHICLE, ORG, "rented"]);
  });

  it("does not update when status already matches", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ status: "rented", current_driver_id: DRIVER }],
      })
      .mockResolvedValueOnce({ rows: [{ exists: false }] });

    await syncVehicleFleetStatus({ query: queryMock }, ORG, VEHICLE);

    expect(queryMock).toHaveBeenCalledTimes(2);
  });
});
