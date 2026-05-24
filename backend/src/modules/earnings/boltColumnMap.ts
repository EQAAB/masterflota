import { normalizeHeaderKey } from "./romanHeaderMap";
import type { BoltComponentField, CanonicalField } from "./normalizeRow";

/** Bolt weekly export columns beyond standard canonical fields. */
export type { BoltComponentField };

export type BoltExtraField = "first_name" | "last_name" | BoltComponentField;

export type BoltColumnField = CanonicalField | BoltExtraField;

/**
 * Bolt weekly CSV — columns used vs ignored.
 *
 * Used (manual tip sum):
 * - Adjusted Earnings (With/Without VAT) + Courier Tips (With/Without VAT)
 * - Overdue courier cash debt (period payout deduction; stored in earnings_records.daily_cash)
 * - Courier UID, Phone, First/Last Name (matching / preview)
 *
 * Ignored (not deducted):
 * - Cash received from Clients — current-week cash handled by Bolt internally
 * - Cash paid to Providers
 *
 * Ignored (not mapped):
 * - Adjusted Earnings with Courier Tips (With/Without VAT) — replaced by component sum
 * - Waiting time compensations — included in Adjusted Earnings
 * - Courier Adjustments, Deposits, Balance Before/After — Bolt internal
 */
/** Tier-A normalized header → field (exact English export). */
const BOLT_TIER_A: Record<string, BoltColumnField> = {
  "courier uid": "courier_id",
  phone: "phone",
  "first name": "first_name",
  "last name": "last_name",
  "adjusted earnings with vat": "adjusted_with_vat",
  "adjusted earnings without vat": "adjusted_without_vat",
  "courier tips with vat": "tips_with_vat",
  "courier tips without vat": "tips_without_vat",
  "overdue courier cash debt": "overdue_cash_debt",
};

/** Full production header row (for tests and fixtures). */
export const BOLT_WEEKLY_EXPORT_HEADERS = [
  "Row Number",
  "Courier UID",
  "First Name",
  "Last Name",
  "Phone",
  "Email",
  "Personal Code",
  "City",
  "Courier Earnings (Without VAT)",
  "Courier Earnings (With VAT)",
  "Waiting time compensations (Without VAT)",
  "Waiting time compensations (with VAT)",
  "Courier Adjustments",
  "Deposits (Without VAT)",
  "Deposits (With VAT)",
  "Adjusted Earnings (Without VAT)",
  "Adjusted Earnings (With VAT)",
  "Adjusted Earnings with Courier Tips (Without VAT)",
  "Adjusted Earnings with Courier Tips (With VAT)",
  "Courier Tips (Without VAT)",
  "Courier Tips (With VAT)",
  "Cash received from Clients",
  "Overdue courier cash debt",
  "Cash paid to Providers",
  "Balance Before Period",
  "Balance After Period",
];

export function buildBoltColumnMap(headers: string[]): Map<number, BoltColumnField> {
  const map = new Map<number, BoltColumnField>();
  const used = new Set<BoltColumnField>();
  const norm = headers.map((h) => normalizeHeaderKey(String(h ?? "")));
  norm.forEach((key, idx) => {
    const field = BOLT_TIER_A[key];
    if (field && !used.has(field)) {
      map.set(idx, field);
      used.add(field);
    }
  });
  return map;
}
