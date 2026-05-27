import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { buildUberColumnMap, UBER_TAXI_EXPORT_HEADERS } from "./uberColumnMap";
import { buildEarningsColumnMap, isUberWeeklyColumnMap } from "./earningsColumnMap";
import { rowCellsToNormalized } from "./normalizeRow";
import { normalizeHeaderKey } from "./romanHeaderMap";
import {
  detectPlatformWithMeta,
  isBoltCourierWeeklyExport,
  isGlovoRomaniaCourierExport,
  isUberRomaniaTaxiExport,
} from "./detectPlatform";
import { calculatePayout } from "./calculatePayout";
import { mapUberTaxiAmounts, resolveUberPlatformNet } from "./mapUberTaxiAmounts";
import { payoutPlatformFromEarnings } from "./payoutPlatform";
import { clampTripDateToPaymentWeek } from "./earningsCommit";
import type { DriverCommissionRow } from "./commission";

const driverPct10: DriverCommissionRow = {
  commission_type: "percentage",
  commission_rate: "10",
  fixed_commission_amount: null,
  minimum_commission: null,
};

describe("isUberRomaniaTaxiExport", () => {
  it("matches production Uber Romania taxi headers", () => {
    const norm = UBER_TAXI_EXPORT_HEADERS.map(normalizeHeaderKey);
    expect(isUberRomaniaTaxiExport(norm)).toBe(true);
    expect(isGlovoRomaniaCourierExport(norm)).toBe(false);
    expect(isBoltCourierWeeklyExport(norm)).toBe(false);
  });
});

describe("detectPlatformWithMeta", () => {
  it("forces uber with confidence 1 for production export", () => {
    const meta = detectPlatformWithMeta("uber-taxi-week.csv", UBER_TAXI_EXPORT_HEADERS);
    expect(meta.platform).toBe("uber");
    expect(meta.confidence).toBe(1);
  });
});

describe("buildUberColumnMap", () => {
  it("maps Tier-A Romanian columns", () => {
    const map = buildUberColumnMap(UBER_TAXI_EXPORT_HEADERS);
    const fields = new Set(map.values());
    expect(fields.has("courier_id")).toBe(true);
    expect(fields.has("first_name")).toBe(true);
    expect(fields.has("last_name")).toBe(true);
    expect(fields.has("received_total")).toBe(true);
    expect(fields.has("net")).toBe(true);
    expect(fields.has("platform_fee")).toBe(true);
    expect(fields.has("daily_cash")).toBe(true);
  });
});

describe("uber row normalization", () => {
  it("derives gross = net - service_fee and abs cash", () => {
    const map = buildUberColumnMap(UBER_TAXI_EXPORT_HEADERS);
    const cells = UBER_TAXI_EXPORT_HEADERS.map(() => "");
    const idx = (h: string) => UBER_TAXI_EXPORT_HEADERS.indexOf(h);
    cells[idx("Identificatorul universal unic (UUID) al șoferului")] = "uuid-1";
    cells[idx("Prenumele șoferului")] = "Ion";
    cells[idx("Numele de familie al șoferului")] = "Popescu";
    cells[idx("Câștiguri primite : Câștigurile tale")] = "100";
    cells[idx("Câștiguri primite:Câștigurile tale:Taxă de servicii")] = "-20";
    cells[idx("Câștiguri primite : Sold cursă : Plăți : Numerar încasat")] = "-15";
    const norm = rowCellsToNormalized(cells, map, "2026-05-11", { uberTaxiExport: true });
    expect(norm.amounts.net).toBe(100);
    expect(norm.amounts.platformFee).toBe(-20);
    expect(norm.amounts.gross).toBe(120);
    expect(norm.amounts.dailyCash).toBe(15);
    expect(norm.hints.driverName).toBe("Ion Popescu");
  });
});

describe("uber payout formula", () => {
  it("commission on net_income and payout subtracts abs cash", () => {
    const r = calculatePayout({
      income: 120,
      tips: null,
      taxa_aplicatie: 20,
      plata_zilnica_cash: 15,
      transferTotal: null,
      resolvedPlatformNet: 100,
      driver: driverPct10,
      commission_base_type: "net_income",
    });
    expect(r.net_income).toBe(100);
    expect(r.commission_base).toBe(100);
    expect(r.company_commission).toBeCloseTo(10, 5);
    expect(r.driver_payout).toBeCloseTo(75, 5);
  });
});

/** Rahmat Ullah production case: platform net must not equal driver payout. */
describe("Rahmat Ullah Uber amounts", () => {
  const driverPct12: DriverCommissionRow = {
    commission_type: "percentage",
    commission_rate: "12",
    fixed_commission_amount: null,
    minimum_commission: null,
  };

  const platformNet = 1353.23;
  const signedFee = -447.09;
  const gross = 1800.32;
  const dailyCash = 200.79;

  it("derives gross = net - signed service fee", () => {
    expect(roundMoney(platformNet - signedFee)).toBe(gross);
  });

  it("uses CSV net for commission base and payout 990.05 after commission and cash", () => {
    const r = calculatePayout({
      income: gross,
      tips: null,
      taxa_aplicatie: Math.abs(signedFee),
      plata_zilnica_cash: dailyCash,
      transferTotal: null,
      resolvedPlatformNet: platformNet,
      driver: driverPct12,
      commission_base_type: "net_income",
    });
    expect(r.net_income).toBe(platformNet);
    expect(r.commission_base).toBe(platformNet);
    expect(r.company_commission).toBeCloseTo(162.39, 2);
    expect(r.driver_payout).toBeCloseTo(990.05, 2);
    expect(r.net_income).not.toBeCloseTo(r.driver_payout, 2);
  });
});

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Muhammad Ikram: Câștigurile tale 0, negative Câștiguri primite → same formula as Glovo. */
describe("Muhammad Ikram Uber debt case", () => {
  const driverPct12: DriverCommissionRow = {
    commission_type: "percentage",
    commission_rate: "12",
    fixed_commission_amount: null,
    minimum_commission: null,
  };

  it("resolveUberPlatformNet uses negative Câștiguri primite when tale is 0", () => {
    expect(resolveUberPlatformNet(0, -1448.48)).toBe(-1448.48);
  });

  it("normalize resolves net and gross = net - fee", () => {
    const map = buildUberColumnMap(UBER_TAXI_EXPORT_HEADERS);
    const cells = UBER_TAXI_EXPORT_HEADERS.map(() => "");
    const idx = (h: string) => UBER_TAXI_EXPORT_HEADERS.indexOf(h);
    cells[idx("Identificatorul universal unic (UUID) al șoferului")] = "uuid-debt";
    cells[idx("Câștiguri primite")] = "-1448.48";
    cells[idx("Câștiguri primite : Câștigurile tale")] = "0";
    const norm = rowCellsToNormalized(cells, map, "2026-05-11", { uberTaxiExport: true });
    expect(norm.amounts.castigurileTale).toBe(0);
    expect(norm.amounts.net).toBe(-1448.48);
    expect(norm.amounts.receivedTotal).toBe(-1448.48);
    expect(norm.amounts.gross).toBe(-1448.48);
  });

  it("mapUberTaxiAmounts: commission = net × rate, payout = net - commission - cash", () => {
    const uber = mapUberTaxiAmounts({
      castigurileTale: 0,
      receivedTotal: -1448.48,
      platformFee: null,
      dailyCash: null,
      tips: null,
      gross: -1448.48,
      driver: driverPct12,
    });
    expect(uber.net).toBe(-1448.48);
    expect(uber.net_income).toBe(-1448.48);
    expect(uber.company_commission).toBeCloseTo(-173.82, 2);
    expect(uber.driver_payout).toBeCloseTo(-1274.66, 2);
    expect(uber.driver_payout).toBeLessThan(0);
  });
});

describe("payout platform mapping", () => {
  it("maps uber earnings to uber payout platform", () => {
    expect(payoutPlatformFromEarnings("uber")).toBe("uber");
  });
});

describe("trip date vs payment week", () => {
  it("clamps filename fallback date into selected payment week", () => {
    expect(clampTripDateToPaymentWeek("2026-04-15", "2026-05-01", "2026-05-07")).toBe("2026-05-01");
    expect(clampTripDateToPaymentWeek("2026-05-05", "2026-05-01", "2026-05-07")).toBe("2026-05-05");
  });
});

describe("fixture CSV integration", () => {
  it("parses fixture via buildEarningsColumnMap", () => {
    const fixturePath = path.join(__dirname, "fixtures/uber/taxi-export-headers.csv");
    const text = fs.readFileSync(fixturePath, "utf8");
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0]!.split(",");
    expect(isUberWeeklyColumnMap(headers)).toBe(true);
    const colMap = buildEarningsColumnMap(headers);
    const cells = lines[1]!.split(",");
    const norm = rowCellsToNormalized(cells, colMap, "2026-05-11", { uberTaxiExport: true });
    expect(norm.amounts.net).toBe(100);
    expect(norm.amounts.gross).toBe(120);
    expect(norm.amounts.dailyCash).toBe(15);
  });
});
