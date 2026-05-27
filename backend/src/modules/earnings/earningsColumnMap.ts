import { isBoltCourierWeeklyExport, isBoltTaxiWeeklyExport, isUberRomaniaTaxiExport } from "./detectPlatform";
import { buildBoltColumnMap, type BoltColumnField } from "./boltColumnMap";
import { buildBoltTaxiColumnMap } from "./boltTaxiColumnMap";
import { buildColumnMap, normalizeHeaderKey } from "./romanHeaderMap";
import { buildUberColumnMap } from "./uberColumnMap";
import type { EarningsColumnField } from "./normalizeRow";

export type { EarningsColumnField };

export function buildEarningsColumnMap(headers: string[]): Map<number, EarningsColumnField> {
  const norm = headers.map((h) => normalizeHeaderKey(String(h ?? "")));
  if (isBoltCourierWeeklyExport(norm)) {
    return buildBoltColumnMap(headers) as Map<number, EarningsColumnField>;
  }
  if (isBoltTaxiWeeklyExport(norm)) {
    return buildBoltTaxiColumnMap(headers) as Map<number, EarningsColumnField>;
  }
  if (isUberRomaniaTaxiExport(norm)) {
    return buildUberColumnMap(headers) as Map<number, EarningsColumnField>;
  }
  return buildColumnMap(headers) as Map<number, EarningsColumnField>;
}

export function isBoltWeeklyColumnMap(headers: string[]): boolean {
  const norm = headers.map((h) => normalizeHeaderKey(String(h ?? "")));
  return isBoltCourierWeeklyExport(norm);
}

export function isUberWeeklyColumnMap(headers: string[]): boolean {
  const norm = headers.map((h) => normalizeHeaderKey(String(h ?? "")));
  return isUberRomaniaTaxiExport(norm);
}

export function isBoltTaxiWeeklyColumnMap(headers: string[]): boolean {
  const norm = headers.map((h) => normalizeHeaderKey(String(h ?? "")));
  return isBoltTaxiWeeklyExport(norm);
}
