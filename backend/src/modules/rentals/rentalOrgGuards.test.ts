import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertRentalCustomerInOrg,
  assertVehicleInOrg,
  RentalOrgScopeError,
} from "./rentalOrgGuards";

const queryMock = vi.fn();

vi.mock("../../db/pool", () => ({
  query: (...args: unknown[]) => queryMock(...args),
}));

const ORG = "11111111-1111-4111-8111-111111111111";
const CUSTOMER = "22222222-2222-4222-8222-222222222222";
const VEHICLE = "33333333-3333-4333-8333-333333333333";

describe("rentalOrgGuards", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  describe("assertRentalCustomerInOrg", () => {
    it("passes when customer belongs to org", async () => {
      queryMock.mockResolvedValueOnce({ rows: [{ id: CUSTOMER }] });
      await expect(assertRentalCustomerInOrg(CUSTOMER, ORG)).resolves.toBeUndefined();
    });

    it("throws when customer is missing or foreign", async () => {
      queryMock.mockResolvedValueOnce({ rows: [] });
      await expect(assertRentalCustomerInOrg(CUSTOMER, ORG)).rejects.toMatchObject({
        message: "Customer not found",
        statusCode: 400,
      });
    });

    it("requires active customer when requireActive is true", async () => {
      queryMock.mockResolvedValueOnce({ rows: [] });
      await expect(
        assertRentalCustomerInOrg(CUSTOMER, ORG, { requireActive: true }),
      ).rejects.toMatchObject({ message: "Customer not found" });
      expect(queryMock.mock.calls[0]?.[0]).toContain("is_active = true");
    });
  });

  describe("assertVehicleInOrg", () => {
    it("passes when vehicle belongs to org", async () => {
      queryMock.mockResolvedValueOnce({ rows: [{ id: VEHICLE }] });
      await expect(assertVehicleInOrg(VEHICLE, ORG)).resolves.toBeUndefined();
    });

    it("throws when vehicle is missing or foreign", async () => {
      queryMock.mockResolvedValueOnce({ rows: [] });
      await expect(assertVehicleInOrg(VEHICLE, ORG)).rejects.toMatchObject({
        message: "Vehicle not found",
        statusCode: 400,
      });
    });
  });
});
