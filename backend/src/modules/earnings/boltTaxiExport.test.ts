import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { buildBoltTaxiColumnMap, BOLT_TAXI_EXPORT_HEADERS } from "./boltTaxiColumnMap";
import { buildEarningsColumnMap, isBoltTaxiWeeklyColumnMap } from "./earningsColumnMap";
import { rowCellsToNormalized } from "./normalizeRow";
import { normalizeHeaderKey } from "./romanHeaderMap";
import {
  detectPlatformWithMeta,
  isBoltCourierWeeklyExport,
  isBoltTaxiWeeklyExport,
} from "./detectPlatform";
import { calculatePayout } from "./calculatePayout";
import { DriverMatchIndex, type DriverMatchRow } from "./matchDriver";
import { payoutPlatformFromEarnings } from "./payoutPlatform";
import type { DriverCommissionRow } from "./commission";

const driverPct12: DriverCommissionRow = {
  commission_type: "percentage",
  commission_rate: "12",
  fixed_commission_amount: null,
  minimum_commission: null,
};

describe("isBoltTaxiWeeklyExport", () => {
  it("matches production Bolt Taxi headers", () => {
    const norm = BOLT_TAXI_EXPORT_HEADERS.map(normalizeHeaderKey);
    expect(isBoltTaxiWeeklyExport(norm)).toBe(true);
    expect(isBoltCourierWeeklyExport(norm)).toBe(false);
  });
});

describe("detectPlatformWithMeta", () => {
  it("forces bolt_taxi with confidence 1", () => {
    const meta = detectPlatformWithMeta("bolt-taxi-week.csv", BOLT_TAXI_EXPORT_HEADERS);
    expect(meta.platform).toBe("bolt_taxi");
    expect(meta.confidence).toBe(1);
  });
});

describe("buildBoltTaxiColumnMap", () => {
  it("maps Tier-A English columns", () => {
    const map = buildBoltTaxiColumnMap(BOLT_TAXI_EXPORT_HEADERS);
    const fields = new Set(map.values());
    expect(fields.has("courier_id")).toBe(true);
    expect(fields.has("driver_name")).toBe(true);
    expect(fields.has("phone")).toBe(true);
    expect(fields.has("email")).toBe(true);
    expect(fields.has("gross")).toBe(true);
    expect(fields.has("net")).toBe(true);
    expect(fields.has("daily_cash")).toBe(true);
  });
});

describe("bolt taxi row normalization", () => {
  it("stores ignored columns in platformMetadata", () => {
    const map = buildBoltTaxiColumnMap(BOLT_TAXI_EXPORT_HEADERS);
    const cells = BOLT_TAXI_EXPORT_HEADERS.map(() => "");
    const idx = (h: string) => BOLT_TAXI_EXPORT_HEADERS.indexOf(h);
    cells[idx("Driver")] = "Muhammad Bilal";
    cells[idx("Driver identifier")] = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    cells[idx("Gross earnings (total) LEI")] = "700";
    cells[idx("Net earnings LEI")] = "642.45";
    cells[idx("Collected cash LEI")] = "396.30";
    cells[idx("Rider tips")] = "10";
    const norm = rowCellsToNormalized(cells, map, "2026-05-11", {
      boltTaxiExport: true,
      headers: BOLT_TAXI_EXPORT_HEADERS,
    });
    expect(norm.amounts.net).toBe(642.45);
    expect(norm.amounts.gross).toBe(700);
    expect(norm.amounts.dailyCash).toBe(396.3);
    expect(norm.hints.driverName).toBe("Muhammad Bilal");
    expect(norm.amounts.platformMetadata?.["rider tips"]).toBe("10");
  });
});

/** Muhammad Bilal production case */
describe("Muhammad Bilal Bolt Taxi payout", () => {
  it("payout = net - commission - cash", () => {
    const r = calculatePayout({
      income: 700,
      tips: null,
      taxa_aplicatie: 0,
      plata_zilnica_cash: 396.3,
      transferTotal: null,
      resolvedPlatformNet: 642.45,
      driver: driverPct12,
      commission_base_type: "net_income",
    });
    expect(r.net_income).toBe(642.45);
    expect(r.company_commission).toBeCloseTo(77.09, 2);
    expect(r.driver_payout).toBeCloseTo(169.06, 2);
    expect(r.driver_payout).toBeGreaterThan(0);
  });
});

describe("DriverMatchIndex name fallback", () => {
  it("matches by driver name when uuid and phone miss", () => {
    const drivers: DriverMatchRow[] = [
      {
        id: "drv-1",
        phone: "000000000",
        first_name: "Muhammad",
        last_name: "Bilal",
        uber_driver_id: null,
        bolt_driver_id: null,
        glovo_courier_id: null,
        bolt_courier_id: null,
        bolt_taxi_driver_uuid: null,
        wolt_courier_id: null,
        commission_type: "percentage",
        commission_rate: "12",
        fixed_commission_amount: null,
        minimum_commission: null,
      },
    ];
    const index = new DriverMatchIndex(drivers, []);
    const hit = index.match("bolt_taxi", { driverName: "Muhammad Bilal" });
    expect(hit.driverId).toBe("drv-1");
    expect(hit.matchMethod).toBe("driver_name");
  });
});

describe("payout platform mapping", () => {
  it("maps bolt_taxi earnings to bolt_taxi payout platform", () => {
    expect(payoutPlatformFromEarnings("bolt_taxi")).toBe("bolt_taxi");
  });
});

describe("fixture CSV integration", () => {
  it("parses fixture via buildEarningsColumnMap", () => {
    const fixturePath = path.join(__dirname, "fixtures/bolt-taxi/export-headers.csv");
    const text = fs.readFileSync(fixturePath, "utf8");
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0]!.split(",");
    expect(isBoltTaxiWeeklyColumnMap(headers)).toBe(true);
    const colMap = buildEarningsColumnMap(headers);
    const cells = lines[1]!.split(",");
    const norm = rowCellsToNormalized(cells, colMap, "2026-05-11", {
      boltTaxiExport: true,
      headers,
    });
    expect(norm.amounts.net).toBe(642.45);
    expect(norm.amounts.dailyCash).toBe(396.3);
  });
});
