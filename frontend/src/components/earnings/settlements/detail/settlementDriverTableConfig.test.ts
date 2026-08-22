import { describe, expect, it } from "vitest";
import {
  detailFieldsForDriver,
  resolveVisibleColumns,
  type FooterTotals,
} from "./settlementDriverTableConfig";
import type { SubcontractorSettlementDetailDriver } from "../../../../api/subcontractorPayouts";

const emptyFooter: FooterTotals = {
  gross: 1000,
  tips: 100,
  commission: 100,
  vehicle_rent: 0,
  account_opening_fee: 0,
  platform_fees: 50,
  daily_cash: -200,
  custom_deductions: 400,
  custom_additions: 0,
  raw_net: 500,
  debt_applied: 0,
  net: 500,
};

const sampleDriver: SubcontractorSettlementDetailDriver = {
  id: "1",
  driver_id: "d1",
  name: "Test Driver",
  gross: "100",
  tips: "10",
  commission: "10",
  vehicle_rent: "0",
  account_opening_fee: "0",
  platform_fees: "5",
  daily_cash: "-20",
  custom_deductions: "100",
  custom_additions: "0",
  raw_net: "45",
  debt_applied: "0",
  net: "45",
};

describe("resolveVisibleColumns", () => {
  it("shows core columns and non-zero settlement totals", () => {
    const cols = resolveVisibleColumns(emptyFooter, { forcedVisible: [], forcedHidden: [] });
    const keys = cols.map((c) => c.key);
    expect(keys).toContain("gross");
    expect(keys).toContain("commission");
    expect(keys).toContain("raw_net");
    expect(keys).toContain("custom_deductions");
    expect(keys).toContain("platform_fees");
    expect(keys).not.toContain("vehicle_rent");
    expect(keys).not.toContain("debt_applied");
  });

  it("respects forced hidden", () => {
    const cols = resolveVisibleColumns(emptyFooter, {
      forcedVisible: [],
      forcedHidden: ["custom_deductions"],
    });
    expect(cols.map((c) => c.key)).not.toContain("custom_deductions");
  });

  it("respects forced visible for zero totals", () => {
    const cols = resolveVisibleColumns(emptyFooter, {
      forcedVisible: ["debt_applied"],
      forcedHidden: [],
    });
    expect(cols.map((c) => c.key)).toContain("debt_applied");
  });
});

describe("detailFieldsForDriver", () => {
  it("lists hidden non-zero fields only", () => {
    const footerNoTips: FooterTotals = { ...emptyFooter, tips: 0 };
    const visible = new Set(
      resolveVisibleColumns(footerNoTips, { forcedVisible: [], forcedHidden: [] }).map((c) => c.key),
    );
    expect(visible.has("tips")).toBe(false);
    const detail = detailFieldsForDriver(sampleDriver, visible);
    const keys = detail.map((c) => c.key);
    expect(keys).not.toContain("gross");
    expect(keys).toContain("tips");
  });
});
