import { describe, expect, it } from "vitest";
import type { DriverPayoutCustomFeesResponse, PayoutListItem } from "../../../api/earnings";
import {
  buildLegFeeDisplayItems,
  buildVehicleRentLadderSteps,
  buildWeekFeeDisplayItems,
  feeSignedAmount,
  findPayoutWithVehicleRent,
  formatVehicleRentLabel,
  pickAnchorPayoutItem,
} from "./payoutFeeBreakdown";

function payout(id: string, platform: string): PayoutListItem {
  return {
    id,
    driver_id: "d1",
    platform_id: null,
    earnings_platform: platform,
    payment_period_start: "2026-01-01",
    payment_period_end: "2026-01-07",
    net_driver_payout: "0",
    raw_net_amount: "0",
    debt_amount: null,
    payment_status: "payable",
  } as PayoutListItem;
}

function fees(
  payoutId: string,
  recurring: { id: string; name: string; amount: string }[],
  manual: { id: string; name: string; amount: string }[] = [],
  anchor = true,
): [string, DriverPayoutCustomFeesResponse] {
  return [
    payoutId,
    {
      items: [],
      recurring_items: recurring.map((r) => ({
        id: r.id,
        fee_name: r.name,
        fee_type: "deduction" as const,
        amount: r.amount,
        source: "recurring" as const,
        recurring_fee_id: "rf1",
        notes: null,
        created_at: "",
      })),
      manual_items: manual.map((m) => ({
        id: m.id,
        fee_name: m.name,
        fee_type: "deduction" as const,
        amount: m.amount,
        source: "manual" as const,
        recurring_fee_id: null,
        notes: null,
        created_at: "",
      })),
      base_raw_net: "0",
      total_deductions: "0",
      total_additions: "0",
      raw_net_amount: "0",
      net_driver_payout: "0",
      is_weekly_fee_anchor: anchor,
      weekly_fee_anchor_platform: anchor ? "uber" : "uber",
    },
  ];
}

describe("pickAnchorPayoutItem", () => {
  it("prefers glovo over uber", () => {
    const items = [payout("u", "uber"), payout("g", "glovo")];
    expect(pickAnchorPayoutItem(items)?.id).toBe("g");
  });

  it("prefers uber over bolt", () => {
    const items = [payout("b", "bolt"), payout("u", "uber")];
    expect(pickAnchorPayoutItem(items)?.id).toBe("u");
  });
});

describe("feeSignedAmount", () => {
  it("negates deductions and keeps additions positive", () => {
    expect(
      feeSignedAmount({
        id: "1",
        fee_name: "A",
        fee_type: "deduction",
        amount: "50",
        source: "manual",
        recurring_fee_id: null,
        notes: null,
        created_at: "",
      }),
    ).toBe(-50);
    expect(
      feeSignedAmount({
        id: "2",
        fee_name: "B",
        fee_type: "addition",
        amount: "25",
        source: "manual",
        recurring_fee_id: null,
        notes: null,
        created_at: "",
      }),
    ).toBe(25);
  });
});

describe("buildWeekFeeDisplayItems", () => {
  it("takes recurring from anchor only and merges manual across legs", () => {
    const items = [payout("uber-id", "uber"), payout("bolt-id", "bolt")];
    const map = new Map([
      fees("uber-id", [{ id: "r1", name: "Insurance", amount: "50" }]),
      fees("bolt-id", [], [{ id: "m1", name: "Damage", amount: "100" }], false),
    ]);

    const result = buildWeekFeeDisplayItems(items, map);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ feeName: "Insurance", source: "recurring", signedAmount: -50 });
    expect(result[1]).toMatchObject({
      feeName: "Damage (Bolt Delivery)",
      source: "manual",
      payoutId: "bolt-id",
      signedAmount: -100,
    });
  });
});

describe("buildLegFeeDisplayItems", () => {
  it("shows recurring only on anchor leg and hint on others", () => {
    const items = [payout("uber-id", "uber"), payout("bolt-id", "bolt")];
    const map = new Map([
      fees("uber-id", [{ id: "r1", name: "Insurance", amount: "50" }]),
      fees("bolt-id", [], [], false),
    ]);
    const week = {
      items: buildWeekFeeDisplayItems(items, map),
      anchorPlatform: "uber",
      anchorPayoutId: "uber-id",
      isLoading: false,
    };

    const anchorLeg = buildLegFeeDisplayItems("uber-id", week);
    expect(anchorLeg.items).toHaveLength(1);
    expect(anchorLeg.anchorHint).toBeUndefined();

    const boltLeg = buildLegFeeDisplayItems("bolt-id", week);
    expect(boltLeg.items).toHaveLength(0);
    expect(boltLeg.anchorHint).toContain("Uber");
  });
});

describe("formatVehicleRentLabel", () => {
  it("includes plate when provided", () => {
    expect(formatVehicleRentLabel("B-123-ABC")).toBe("Vehicle rent (B-123-ABC)");
    expect(formatVehicleRentLabel(null)).toBe("Vehicle rent");
  });
});

describe("findPayoutWithVehicleRent", () => {
  it("returns leg with highest vehicle_rental_fee", () => {
    const items = [
      { ...payout("u", "uber"), vehicle_rental_fee: "0" },
      { ...payout("b", "bolt"), vehicle_rental_fee: "250" },
    ] as PayoutListItem[];
    expect(findPayoutWithVehicleRent(items)?.id).toBe("b");
  });
});

describe("buildVehicleRentLadderSteps", () => {
  it("returns empty when no rent", () => {
    expect(buildVehicleRentLadderSteps({ totalRent: 0 })).toEqual([]);
  });

  it("returns single step with plate label", () => {
    const steps = buildVehicleRentLadderSteps({
      totalRent: 200,
      licensePlate: "B-99-XYZ",
    });
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({
      label: "Vehicle rent (B-99-XYZ)",
      amount: -200,
    });
  });

  it("splits multiple rent entries", () => {
    const steps = buildVehicleRentLadderSteps({
      totalRent: 300,
      licensePlate: "B-1",
      rentEntries: [
        { id: "1", vehicle_rental_id: null, entry_type: "current_week", amount: "200", description: null },
        { id: "2", vehicle_rental_id: null, entry_type: "overdue", amount: "100", description: "Prior week" },
      ],
    });
    expect(steps).toHaveLength(2);
    expect(steps[0]?.label).toContain("This week");
    expect(steps[0]?.amount).toBe(-200);
    expect(steps[1]?.label).toContain("Overdue");
    expect(steps[1]?.hint).toBe("Prior week");
  });
});
