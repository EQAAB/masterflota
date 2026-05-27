import { isEmptyCellValue } from "../../lib/isEmptyRow";
import { roundMoney } from "./debtAllocation";
import { resolveUberPlatformNet } from "./mapUberTaxiAmounts";

export type CanonicalField =
  | "plate"
  | "phone"
  | "courier_id"
  | "trip_date"
  | "gross"
  | "platform_fee"
  | "net"
  | "transfer_total"
  | "daily_cash"
  | "account_opening_fee"
  | "trips"
  | "tips";

export interface RowHints {
  courierId?: string;
  phone?: string;
  plate?: string;
  /** Bolt weekly export: First Name + Last Name (preview / warnings only). */
  driverName?: string;
}

export interface NormalizedAmounts {
  gross: number | null;
  net: number | null;
  platformFee: number | null;
  /** Total Venituri de transferat (TVT); commission transfer base when present. */
  transferTotal: number | null;
  dailyCash: number | null;
  /** Magnitude only; CSV may show negative (e.g. -71.44). */
  accountOpeningFee: number | null;
  tripCount: number | null;
  /** Tips / bacșiș; gross remains base income (CSV Venituri) when both columns exist. */
  tips?: number | null;
  /** Bolt weekly: component columns before manual sum (commit uses all four). */
  boltAdjustedWithoutVat?: number | null;
  boltTipsWithoutVat?: number | null;
  /** Uber: parent Câștiguri primite total (debt weeks when Câștigurile tale is 0). */
  receivedTotal?: number | null;
  /** Uber: raw CSV Câștigurile tale before {@link resolveUberPlatformNet}. */
  castigurileTale?: number | null;
}

export interface NormalizedEarningsRow {
  tripDateIso: string | null;
  hints: RowHints;
  amounts: NormalizedAmounts;
  rawSample: Record<string, string>;
}

/** Persisted in earnings_import_staging.payload */
export interface EarningsStagingPayload {
  tripDateIso: string | null;
  hints: RowHints;
  amounts: NormalizedAmounts;
  rawSample: Record<string, string>;
}

/** Romanian-style amounts: optional thousands `.`, optional `,` decimals; leading `-` supported. */
function parseRoNumber(s: string): number | null {
  let t = s.trim().replace(/\s/g, "");
  if (!t || t === "-") return null;
  const comma = t.indexOf(",");
  const dot = t.indexOf(".");
  if (comma !== -1 && comma > dot) {
    t = `${t.slice(0, comma).replace(/\./g, "")}.${t.slice(comma + 1)}`;
  } else if (comma !== -1 && dot === -1) {
    t = t.replace(",", ".");
  } else {
    t = t.replace(/,/g, "");
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseRoDate(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(t);
  if (iso) return iso[0];
  const dmy = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/.exec(t);
  if (dmy) {
    let d = parseInt(dmy[1], 10);
    let m = parseInt(dmy[2], 10);
    let y = parseInt(dmy[3], 10);
    if (y < 100) y += 2000;
    if (m > 12 && d <= 12) {
      const tmp = d;
      d = m;
      m = tmp;
    }
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (!Number.isNaN(dt.getTime())) {
      return dt.toISOString().slice(0, 10);
    }
  }
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function cleanHint(s: string): string | undefined {
  const v = s.trim();
  return v.length ? v : undefined;
}

export interface RowNormalizeOptions {
  /**
   * When set (e.g. Glovo), do not set platformFee from |gross - net|.
   * That difference is often the “Ajustări” bucket, not Taxa aplicatie.
   */
  skipInferredPlatformFee?: boolean;
  /** Bolt Tier-A weekly export: do not infer platform fee from gross−net (VAT gap). */
  boltWeeklyExport?: boolean;
  /** Uber Romania taxi export: gross = net − service_fee; cash stored as magnitude. */
  uberTaxiExport?: boolean;
}

/** Bolt weekly CSV component columns (manual tip sum). */
export type BoltComponentField =
  | "adjusted_with_vat"
  | "adjusted_without_vat"
  | "tips_with_vat"
  | "tips_without_vat"
  | "overdue_cash_debt";

export type EarningsColumnField =
  | CanonicalField
  | "first_name"
  | "last_name"
  | "received_total"
  | BoltComponentField;

export function rowCellsToNormalized(
  cells: string[],
  colMap: Map<number, EarningsColumnField>,
  fallbackTripDate: string | null,
  opts?: RowNormalizeOptions,
): NormalizedEarningsRow {
  const hints: RowHints = {};
  let firstName = "";
  let lastName = "";
  let tripDateIso: string | null = null;
  const amounts: NormalizedAmounts = {
    gross: null,
    net: null,
    platformFee: null,
    transferTotal: null,
    dailyCash: null,
    accountOpeningFee: null,
    tripCount: null,
    tips: null,
  };
  const rawSample: Record<string, string> = {};
  let boltAdjustedWithVat: number | null = null;
  let boltAdjustedWithoutVat: number | null = null;
  let boltTipsWithVat: number | null = null;
  let boltTipsWithoutVat: number | null = null;
  let boltOverdueCashDebt: number | null = null;

  colMap.forEach((field, idx) => {
    const raw = String(cells[idx] ?? "").trim();
    if (raw) rawSample[field] = raw;
    switch (field) {
      case "plate":
        hints.plate = cleanHint(raw);
        break;
      case "phone":
        hints.phone = cleanHint(raw);
        break;
      case "courier_id":
        hints.courierId = cleanHint(raw);
        break;
      case "trip_date":
        tripDateIso = parseRoDate(raw) ?? tripDateIso;
        break;
      case "gross":
        amounts.gross = parseRoNumber(raw);
        break;
      case "net":
        amounts.net = parseRoNumber(raw);
        break;
      case "received_total":
        amounts.receivedTotal = parseRoNumber(raw);
        break;
      case "transfer_total": {
        const v = parseRoNumber(raw);
        amounts.transferTotal = v;
        break;
      }
      case "platform_fee": {
        const v = parseRoNumber(raw);
        amounts.platformFee = v;
        break;
      }
      case "daily_cash":
        amounts.dailyCash = parseRoNumber(raw);
        break;
      case "account_opening_fee": {
        const v = parseRoNumber(raw);
        amounts.accountOpeningFee = v === null ? null : Math.abs(v);
        break;
      }
      case "trips":
        amounts.tripCount = parseRoNumber(raw);
        if (amounts.tripCount !== null) amounts.tripCount = Math.round(amounts.tripCount);
        break;
      case "tips":
        amounts.tips = parseRoNumber(raw);
        break;
      case "first_name":
        firstName = raw;
        break;
      case "last_name":
        lastName = raw;
        break;
      case "adjusted_with_vat":
        boltAdjustedWithVat = parseRoNumber(raw);
        break;
      case "adjusted_without_vat":
        boltAdjustedWithoutVat = parseRoNumber(raw);
        break;
      case "tips_with_vat":
        boltTipsWithVat = parseRoNumber(raw);
        break;
      case "tips_without_vat":
        boltTipsWithoutVat = parseRoNumber(raw);
        break;
      case "overdue_cash_debt":
        boltOverdueCashDebt = parseRoNumber(raw);
        break;
      default:
        break;
    }
  });

  const nameParts = [firstName.trim(), lastName.trim()].filter(Boolean);
  if (nameParts.length) hints.driverName = nameParts.join(" ");

  if (!tripDateIso && fallbackTripDate) tripDateIso = fallbackTripDate;

  if (opts?.boltWeeklyExport) {
    const income = boltAdjustedWithVat ?? 0;
    const tipsGross = boltTipsWithVat ?? 0;
    const netBase = boltAdjustedWithoutVat ?? 0;
    const tipsNet = boltTipsWithoutVat ?? 0;
    amounts.boltAdjustedWithoutVat = boltAdjustedWithoutVat;
    amounts.boltTipsWithoutVat = boltTipsWithoutVat;
    amounts.gross =
      boltAdjustedWithVat !== null || boltTipsWithVat !== null ? roundMoney(income) : null;
    amounts.tips =
      boltTipsWithVat !== null ? roundMoney(tipsGross) : null;
    amounts.net =
      boltAdjustedWithoutVat !== null || boltTipsWithoutVat !== null
        ? roundMoney(netBase + tipsNet)
        : null;
    amounts.dailyCash =
      boltOverdueCashDebt !== null ? roundMoney(Math.abs(boltOverdueCashDebt)) : null;
  } else if (opts?.uberTaxiExport) {
    if (amounts.dailyCash !== null) {
      amounts.dailyCash = roundMoney(Math.abs(amounts.dailyCash));
    }
    let received = amounts.receivedTotal;
    const castigurileTale = amounts.net;
    amounts.castigurileTale = castigurileTale;
    if (received == null && (castigurileTale ?? 0) <= 0 && amounts.platformFee != null && amounts.platformFee < 0) {
      received = amounts.platformFee;
      amounts.receivedTotal = received;
    }
    const platformNet = resolveUberPlatformNet(castigurileTale, received ?? null);
    amounts.net = platformNet;
    if (amounts.platformFee != null) {
      amounts.gross = roundMoney(platformNet - amounts.platformFee);
    } else if (platformNet !== 0) {
      amounts.gross = platformNet;
    }
  } else {
    if (amounts.gross === null && amounts.net !== null && amounts.platformFee !== null) {
      amounts.gross = amounts.net + amounts.platformFee;
    }
    if (amounts.net === null && amounts.gross !== null && amounts.platformFee !== null) {
      amounts.net = amounts.gross - amounts.platformFee;
    }
    if (
      !opts?.skipInferredPlatformFee &&
      amounts.platformFee === null &&
      amounts.gross !== null &&
      amounts.net !== null
    ) {
      amounts.platformFee = amounts.gross - amounts.net;
    }
  }

  return { tripDateIso, hints, amounts, rawSample };
}

/** Row has no mapped hints, amounts, or raw cell data (ignores filename-only trip date). */
export function isNormalizedEarningsRowEmpty(row: NormalizedEarningsRow): boolean {
  const hasHints = Object.values(row.hints).some((v) => !isEmptyCellValue(v));
  if (hasHints) return false;

  const hasRaw = Object.values(row.rawSample).some((v) => !isEmptyCellValue(v));
  if (hasRaw) return false;

  const amt = row.amounts;
  return !(
    amt.gross != null ||
    amt.net != null ||
    amt.transferTotal != null ||
    amt.platformFee != null ||
    amt.dailyCash != null ||
    amt.accountOpeningFee != null ||
    amt.tripCount != null ||
    amt.tips != null ||
    amt.boltAdjustedWithoutVat != null ||
    amt.boltTipsWithoutVat != null ||
    amt.receivedTotal != null
  );
}

export function filterEmptyNormalizedEarningsRows(rows: NormalizedEarningsRow[]): {
  rows: NormalizedEarningsRow[];
  emptyRowsSkipped: number;
} {
  const kept: NormalizedEarningsRow[] = [];
  let emptyRowsSkipped = 0;
  for (const row of rows) {
    if (isNormalizedEarningsRowEmpty(row)) {
      emptyRowsSkipped += 1;
    } else {
      kept.push(row);
    }
  }
  return { rows: kept, emptyRowsSkipped };
}
