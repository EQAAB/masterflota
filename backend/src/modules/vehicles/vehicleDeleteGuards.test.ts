import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertVehicleHasNoRentalBookings,
  VehicleDeleteBlockedError,
} from "./vehicleDeleteGuards";

const queryMock = vi.fn();

vi.mock("../../db/pool", () => ({
  query: (...args: unknown[]) => queryMock(...args),
}));

const ORG = "11111111-1111-4111-8111-111111111111";
const VEHICLE = "33333333-3333-4333-8333-333333333333";

describe("vehicleDeleteGuards", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  describe("assertVehicleHasNoRentalBookings", () => {
    it("passes when vehicle has no rental bookings", async () => {
      queryMock.mockResolvedValueOnce({ rows: [{ n: 0, numbers: null }] });
      await expect(assertVehicleHasNoRentalBookings(VEHICLE, ORG)).resolves.toBeUndefined();
    });

    it("throws 409 when rental bookings exist", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ n: 2, numbers: ["RB-002", "RB-001"] }],
      });
      await expect(assertVehicleHasNoRentalBookings(VEHICLE, ORG)).rejects.toMatchObject({
        message: expect.stringContaining("2 rental booking(s)"),
        statusCode: 409,
      });
    });

    it("includes booking numbers when count is 3 or fewer", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ n: 1, numbers: ["RB-100"] }],
      });
      await expect(assertVehicleHasNoRentalBookings(VEHICLE, ORG)).rejects.toMatchObject({
        message: expect.stringContaining("Bookings: RB-100"),
        statusCode: 409,
      });
    });

    it("omits booking numbers when count exceeds 3", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ n: 5, numbers: ["RB-005", "RB-004", "RB-003", "RB-002", "RB-001"] }],
      });
      try {
        await assertVehicleHasNoRentalBookings(VEHICLE, ORG);
        expect.fail("expected throw");
      } catch (err) {
        expect(err).toBeInstanceOf(VehicleDeleteBlockedError);
        const message = (err as VehicleDeleteBlockedError).message;
        expect(message).toContain("5 rental booking(s)");
        expect(message).not.toContain("Bookings:");
      }
    });
  });
});
