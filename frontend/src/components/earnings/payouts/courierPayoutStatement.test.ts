import { describe, expect, it } from "vitest";
import type { PayoutListItem } from "../../../api/earnings";
import { computeUnifiedBreakdown, type UnifiedPayoutBreakdown } from "./payoutBreakdownUtils";
import { buildCourierStatementModel } from "./courierStatementModel";

function line(partial: Partial<PayoutListItem> & Pick<PayoutListItem, "id">): PayoutListItem {
  return {
    driver_id: "d1",
    first_name: "A",
    last_name: "B",
    phone: null,
    earnings_platform: "glovo",
    platform_id: "073",
    payment_period_start: "2026-10-12",
    payment_period_end: "2026-10-18",
    payment_status: "pending",
    net_driver_payout: "1596.73",
    raw_net_amount: "1596.73",
    total_gross_earnings: "2227.97",
    income: "2227.97",
    tips: "0",
    total_platform_fees: "0",
    total_daily_cash: "308.44",
    account_opening_fee: "100",
    company_commission: "222.80",
    net_income: "2227.97",
    vehicle_rental_fee: "0",
    debt_applied_amount: "0",
    remaining_debt_amount: "0",
    ...partial,
  } as PayoutListItem;
}

function rowFor(finalNet: string) {
  return {
    driver_id: "d1",
    first_name: "Gizachew",
    last_name: "Gebre",
    phone: null,
    payment_period_start: "2026-10-12",
    payment_period_end: "2026-10-18",
    total_amount: finalNet,
    total_gross: "0",
    total_fees: "0",
    platforms: ["glovo"],
    platform_payout_ids: ["p1"],
    platform_lines: [],
    consolidated_status: "payable",
    can_pay: true,
    driver_payment_id: null,
    paid_at: null,
  };
}

describe("buildCourierStatementModel", () => {
  it("keeps the standard ladder, including a zero vehicle rent", () => {
    const items = [line({ id: "p1" })];
    const breakdown = computeUnifiedBreakdown(rowFor("1596.73") as never, items);
    const model = buildCourierStatementModel({
      breakdown,
      payoutItems: items,
    });

    expect(model.lines.map((l) => l.key)).toEqual([
      "net-income",
      "fleet-commission",
      "cash",
      "tax",
      "vehicle-rent",
    ]);
    expect(model.lines.find((l) => l.key === "tax")?.amount).toBe(-100);
    expect(model.lines.find((l) => l.key === "vehicle-rent")?.amount).toBe(0);
    const sum = Math.round(model.lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
    expect(sum).toBe(model.finalNet);
    expect(model.multiPlatform).toBe(false);
    expect(model.courierIds).toEqual(["073"]);
  });

  it("hides the zero account-opening tax row when a fee named Tax is already listed", () => {
    const items = [line({ id: "p1", account_opening_fee: "0" })];
    const breakdown = computeUnifiedBreakdown(rowFor("1596.73") as never, items);
    const model = buildCourierStatementModel({
      breakdown,
      payoutItems: items,
      weekFeeBreakdown: {
        items: [
          {
            id: "fee-tax",
            payoutId: "p1",
            feeName: "Tax",
            signedAmount: -100,
            source: "recurring",
          },
        ],
        anchorPlatform: "glovo",
        anchorPayoutId: "p1",
        isLoading: false,
      },
    });

    const taxLines = model.lines.filter((l) => l.label.trim().toLowerCase() === "tax" || l.key === "tax");
    expect(taxLines).toHaveLength(1);
    expect(taxLines[0]?.key).toBe("fee-tax");
    expect(taxLines[0]?.amount).toBe(-100);
    expect(model.lines.find((l) => l.key === "tax")).toBeUndefined();
  });

  it("adds an other-adjustments line when the ladder does not match final net", () => {
    const breakdown = {
      totalNetIncome: 100,
      totalFleetSub: 0,
      totalCashBalance: 0,
      platforms: [{ accountOpeningFee: 0, platform: "uber", netIncome: 100 }],
      customFeeVehicleRent: 0,
      totalDebtApplied: 0,
      finalNet: 80,
    } as UnifiedPayoutBreakdown;

    const model = buildCourierStatementModel({
      breakdown,
      payoutItems: [],
    });
    const other = model.lines.find((l) => l.key === "other");
    expect(other?.amount).toBe(-20);
    const sum = Math.round(model.lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
    expect(sum).toBe(80);
  });
});
