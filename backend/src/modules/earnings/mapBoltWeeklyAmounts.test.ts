import { describe, expect, it } from "vitest";
import { mapBoltWeeklyAmounts } from "./mapBoltWeeklyAmounts";

describe("mapBoltWeeklyAmounts", () => {
  it("sums adjusted earnings + courier tips per VAT tier; platform_fee is always 0", () => {
    const r = mapBoltWeeklyAmounts({
      adjustedEarningsWithVat: 1000,
      adjustedEarningsWithoutVat: 900,
      courierTipsWithVat: 100,
      courierTipsWithoutVat: 80,
    });
    expect(r.income).toBe(1000);
    expect(r.tips).toBe(100);
    expect(r.net_income).toBe(980);
    expect(r.gross_income).toBe(1100);
    expect(r.platform_fee).toBe(0);
  });

  it("Muhammad Ikram sample: net = adjusted without + tips without (2944.08)", () => {
    const r = mapBoltWeeklyAmounts({
      adjustedEarningsWithVat: 3277.99,
      adjustedEarningsWithoutVat: 2709.08,
      courierTipsWithVat: 235,
      courierTipsWithoutVat: 235,
    });
    expect(r.net_income).toBe(2944.08);
    expect(r.gross_income).toBe(3512.99);
    expect(r.income).toBe(3277.99);
    expect(r.tips).toBe(235);
  });

  it("treats missing tip components as zero", () => {
    const r = mapBoltWeeklyAmounts({
      adjustedEarningsWithVat: 880,
      adjustedEarningsWithoutVat: 800,
      courierTipsWithVat: 0,
      courierTipsWithoutVat: 0,
    });
    expect(r.income).toBe(880);
    expect(r.tips).toBe(0);
    expect(r.net_income).toBe(800);
    expect(r.gross_income).toBe(880);
  });
});
