import { describe, expect, it } from "vitest";
import { buildBoltColumnMap, BOLT_WEEKLY_EXPORT_HEADERS } from "./boltColumnMap";
import { rowCellsToNormalized } from "./normalizeRow";
import { normalizeHeaderKey } from "./romanHeaderMap";
import {
  detectPlatformWithMeta,
  isBoltCourierWeeklyExport,
  isGlovoRomaniaCourierExport,
} from "./detectPlatform";
import { computePayoutBeforeRent } from "./recomputeDriverPayoutRollup";
import { computeCompanyCommissionFromBase } from "./commission";

describe("isBoltCourierWeeklyExport", () => {
  it("matches production Bolt weekly export headers", () => {
    const norm = BOLT_WEEKLY_EXPORT_HEADERS.map(normalizeHeaderKey);
    expect(isBoltCourierWeeklyExport(norm)).toBe(true);
    expect(isGlovoRomaniaCourierExport(norm)).toBe(false);
  });

  it("does not match Glovo Romania export", () => {
    const norm = [
      "ID Curier",
      "Venituri",
      "Total venituri de transferat",
      "Taxa aplicatie",
    ].map(normalizeHeaderKey);
    expect(isBoltCourierWeeklyExport(norm)).toBe(false);
    expect(isGlovoRomaniaCourierExport(norm)).toBe(true);
  });
});

describe("detectPlatformWithMeta", () => {
  it("forces bolt_courier with confidence 1 for production export", () => {
    const meta = detectPlatformWithMeta("bolt-delivery-week.csv", BOLT_WEEKLY_EXPORT_HEADERS);
    expect(meta.platform).toBe("bolt_courier");
    expect(meta.confidence).toBe(1);
  });

  it("maps Tier-A component columns (not combined with-tips or cash received)", () => {
    const map = buildBoltColumnMap(BOLT_WEEKLY_EXPORT_HEADERS);
    const fields = new Set(map.values());
    expect(fields.has("courier_id")).toBe(true);
    expect(fields.has("phone")).toBe(true);
    expect(fields.has("first_name")).toBe(true);
    expect(fields.has("last_name")).toBe(true);
    expect(fields.has("adjusted_with_vat")).toBe(true);
    expect(fields.has("adjusted_without_vat")).toBe(true);
    expect(fields.has("tips_with_vat")).toBe(true);
    expect(fields.has("tips_without_vat")).toBe(true);
    expect(fields.has("overdue_cash_debt")).toBe(true);
    expect(fields.has("daily_cash")).toBe(false);
    expect(fields.has("gross")).toBe(false);
    expect(fields.has("net")).toBe(false);
    expect(fields.has("tips")).toBe(false);
    expect(fields.has("trip_date")).toBe(false);
    expect(fields.has("platform_fee")).toBe(false);
  });
});

describe("buildBoltColumnMap row parse", () => {
  it("normalizes driver name and manual tip sum from component columns", () => {
    const map = buildBoltColumnMap(BOLT_WEEKLY_EXPORT_HEADERS);
    const cells = BOLT_WEEKLY_EXPORT_HEADERS.map(() => "");
    const idx = (h: string) => BOLT_WEEKLY_EXPORT_HEADERS.indexOf(h);
    cells[idx("Courier UID")] = "uid-1";
    cells[idx("First Name")] = "Ion";
    cells[idx("Last Name")] = "Vasilescu";
    cells[idx("Adjusted Earnings (With VAT)")] = "100";
    cells[idx("Adjusted Earnings (Without VAT)")] = "90";
    cells[idx("Courier Tips (With VAT)")] = "5";
    cells[idx("Courier Tips (Without VAT)")] = "4";
    cells[idx("Overdue courier cash debt")] = "12";
    cells[idx("Cash received from Clients")] = "9999";
    const norm = rowCellsToNormalized(cells, map, "2026-05-11", { boltWeeklyExport: true });
    expect(norm.hints.driverName).toBe("Ion Vasilescu");
    expect(norm.hints.courierId).toBe("uid-1");
    expect(norm.amounts.gross).toBe(100);
    expect(norm.amounts.tips).toBe(5);
    expect(norm.amounts.net).toBe(94);
    expect(norm.amounts.dailyCash).toBe(12);
    expect(norm.amounts.platformFee).toBeNull();
  });

  it("reads component columns from a sample row; ignores cash received from clients", () => {
    const headers = BOLT_WEEKLY_EXPORT_HEADERS;
    const map = buildBoltColumnMap(headers);
    const row = [
      "1",
      "bolt-uid-99",
      "Ana",
      "Pop",
      "+40722111222",
      "a@x.ro",
      "",
      "Bucharest",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "800.00",
      "880.00",
      "",
      "",
      "40.00",
      "25.00",
      "3264.31",
      "150.00",
      "",
      "",
      "",
    ];
    const byField = new Map<string, string>();
    map.forEach((field, idx) => {
      byField.set(field, row[idx] ?? "");
    });
    expect(byField.get("courier_id")).toBe("bolt-uid-99");
    expect(byField.get("adjusted_with_vat")).toBe("880.00");
    expect(byField.get("adjusted_without_vat")).toBe("800.00");
    expect(byField.get("tips_with_vat")).toBe("25.00");
    expect(byField.get("tips_without_vat")).toBe("40.00");
    expect(byField.get("overdue_cash_debt")).toBe("150.00");
    expect(byField.get("daily_cash")).toBeUndefined();

    const norm = rowCellsToNormalized(row, map, "2026-05-11", { boltWeeklyExport: true });
    expect(norm.amounts.gross).toBe(880);
    expect(norm.amounts.tips).toBe(25);
    expect(norm.amounts.net).toBe(840);
    expect(norm.amounts.dailyCash).toBe(150);

    const comm = computeCompanyCommissionFromBase(
      { commission_type: "percentage", commission_rate: "10", fixed_commission_amount: null, minimum_commission: null },
      840,
    );
    const payout = computePayoutBeforeRent({
      platformNet: 840,
      companyCommission: comm.company_commission,
      cashDeduction: 150,
      accountOpeningFee: 0,
    });
    expect(payout).toBe(606);
  });
});
