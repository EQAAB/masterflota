import { normalizeHeaderKey } from "./romanHeaderMap";
import type { CanonicalField } from "./normalizeRow";

export type BoltTaxiExtraField = "driver_name" | "email";

export type BoltTaxiColumnField = CanonicalField | BoltTaxiExtraField;

/** Production Bolt Taxi weekly export headers (for tests/fixtures). */
export const BOLT_TAXI_EXPORT_HEADERS = [
  "Driver",
  "Email",
  "Phone",
  "Driver identifier",
  "Gross earnings (total) LEI",
  "Net earnings LEI",
  "Collected cash LEI",
  "Gross earnings (in-app)",
  "Rider tips",
  "Commission fees",
];

function headerMatches(field: BoltTaxiColumnField, key: string): boolean {
  switch (field) {
    case "courier_id":
      return key.includes("driver identifier");
    case "driver_name":
      return key === "driver";
    case "phone":
      return key === "phone";
    case "email":
      return key === "email";
    case "gross":
      return key.includes("gross earnings") && key.includes("total");
    case "net":
      return key.includes("net earnings");
    case "daily_cash":
      return key.includes("collected cash");
    default:
      return false;
  }
}

const BOLT_TAXI_FIELDS: BoltTaxiColumnField[] = [
  "courier_id",
  "driver_name",
  "phone",
  "email",
  "gross",
  "net",
  "daily_cash",
];

export function buildBoltTaxiColumnMap(headers: string[]): Map<number, BoltTaxiColumnField> {
  const map = new Map<number, BoltTaxiColumnField>();
  const used = new Set<BoltTaxiColumnField>();
  const norm = headers.map((h) => normalizeHeaderKey(String(h ?? "")));
  norm.forEach((key, idx) => {
    if (!key) return;
    for (const field of BOLT_TAXI_FIELDS) {
      if (used.has(field)) continue;
      if (headerMatches(field, key)) {
        map.set(idx, field);
        used.add(field);
        break;
      }
    }
  });
  return map;
}
