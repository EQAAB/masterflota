import { normalizeHeaderKey } from "./romanHeaderMap";
import type { CanonicalField } from "./normalizeRow";

export type UberExtraField = "first_name" | "last_name" | "received_total";

export type UberColumnField = CanonicalField | UberExtraField;

/** Production Uber Romania taxi export header row (for tests/fixtures). */
export const UBER_TAXI_EXPORT_HEADERS = [
  "Identificatorul universal unic (UUID) al șoferului",
  "Prenumele șoferului",
  "Numele de familie al șoferului",
  "Câștiguri primite",
  "Câștiguri primite : Câștigurile tale",
  "Câștiguri primite:Câștigurile tale:Taxă de servicii",
  "Câștiguri primite : Sold cursă : Plăți : Numerar încasat",
];

function headerMatches(field: UberColumnField, key: string): boolean {
  switch (field) {
    case "courier_id":
      return key.includes("uuid") && key.includes("soferului");
    case "first_name":
      return key.includes("prenumele") && key.includes("soferului");
    case "last_name":
      return key.includes("numele de familie") && key.includes("soferului");
    case "received_total":
      return (
        key.includes("castiguri primite") &&
        !key.includes("castigurile tale") &&
        !key.includes("taxa de servicii") &&
        !key.includes("numerar") &&
        !key.includes("sold cursa")
      );
    case "net":
      return key.includes("castigurile tale") && !key.includes("taxa de servicii");
    case "platform_fee":
      return key.includes("taxa de servicii");
    case "daily_cash":
      return key.includes("numerar incasat");
    default:
      return false;
  }
}

const UBER_FIELDS: UberColumnField[] = [
  "courier_id",
  "first_name",
  "last_name",
  "received_total",
  "net",
  "platform_fee",
  "daily_cash",
];

export function buildUberColumnMap(headers: string[]): Map<number, UberColumnField> {
  const map = new Map<number, UberColumnField>();
  const used = new Set<UberColumnField>();
  const norm = headers.map((h) => normalizeHeaderKey(String(h ?? "")));
  norm.forEach((key, idx) => {
    if (!key) return;
    for (const field of UBER_FIELDS) {
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
