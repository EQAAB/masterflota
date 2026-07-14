import type { NormalizedEarningsRow } from "./normalizeRow";

export type DuplicateCourierIdGroup = {
  courierId: string;
  count: number;
  /** 1-based row numbers for messages (file data rows after empty filter). */
  rowNumbers: number[];
};

export type ExactDuplicateRowGroup = {
  key: string;
  count: number;
  rowNumbers: number[];
  courierId: string | null;
};

function normalizeCourierId(raw: string | undefined | null): string | null {
  const t = raw?.trim();
  if (!t) return null;
  return t.toLowerCase();
}

/** Find platform/courier IDs that appear more than once in a weekly import file. */
export function findDuplicateCourierIds(rows: NormalizedEarningsRow[]): DuplicateCourierIdGroup[] {
  const map = new Map<string, { display: string; rowNumbers: number[] }>();
  rows.forEach((row, index) => {
    const key = normalizeCourierId(row.hints.courierId);
    if (!key) return;
    const existing = map.get(key);
    const rowNumber = index + 1;
    if (existing) {
      existing.rowNumbers.push(rowNumber);
    } else {
      map.set(key, { display: row.hints.courierId!.trim(), rowNumbers: [rowNumber] });
    }
  });

  return [...map.entries()]
    .filter(([, v]) => v.rowNumbers.length > 1)
    .map(([, v]) => ({
      courierId: v.display,
      count: v.rowNumbers.length,
      rowNumbers: v.rowNumbers,
    }))
    .sort((a, b) => a.courierId.localeCompare(b.courierId));
}

function exactRowKey(row: NormalizedEarningsRow): string {
  const g = row.amounts.gross;
  const n = row.amounts.net;
  const tt = row.amounts.transferTotal;
  return [
    normalizeCourierId(row.hints.courierId) ?? "",
    row.hints.phone?.trim().toLowerCase() ?? "",
    row.hints.plate?.trim().toLowerCase() ?? "",
    row.tripDateIso ?? "",
    g ?? "",
    n ?? "",
    tt ?? "",
  ].join("|");
}

/** Exact clone rows (same identifiers, date, and amounts). */
export function findExactDuplicateRows(rows: NormalizedEarningsRow[]): ExactDuplicateRowGroup[] {
  const map = new Map<string, { count: number; rowNumbers: number[]; courierId: string | null }>();
  rows.forEach((row, index) => {
    const key = exactRowKey(row);
    // Skip keys with no identity or money signals (empty-ish rows shouldn't trip this)
    if (key === "||||||") return;
    const existing = map.get(key);
    const rowNumber = index + 1;
    const courierId = row.hints.courierId?.trim() || null;
    if (existing) {
      existing.count += 1;
      existing.rowNumbers.push(rowNumber);
    } else {
      map.set(key, { count: 1, rowNumbers: [rowNumber], courierId });
    }
  });

  return [...map.entries()]
    .filter(([, v]) => v.count > 1)
    .map(([key, v]) => ({
      key,
      count: v.count,
      rowNumbers: v.rowNumbers,
      courierId: v.courierId,
    }));
}

export function duplicateCourierIdsMessage(dups: DuplicateCourierIdGroup[]): string {
  const sample = dups.slice(0, 5).map((d) => {
    const rows = d.rowNumbers.slice(0, 6).join(", ");
    const more = d.rowNumbers.length > 6 ? ", …" : "";
    return `"${d.courierId}" (${d.count}×, rows ${rows}${more})`;
  });
  const extra = dups.length > 5 ? ` and ${dups.length - 5} more` : "";
  return `Duplicate platform ID(s) in this file: ${sample.join("; ")}${extra}. Remove duplicates before importing (one row per platform ID for weekly reports).`;
}

export function exactDuplicateRowsMessage(dups: ExactDuplicateRowGroup[]): string {
  const n = dups.reduce((sum, d) => sum + (d.count - 1), 0);
  return `Exact duplicate row(s) detected (${n} repeated). Same identifiers, date, and amounts appear more than once. Remove clones before importing.`;
}

export class DuplicateRowsInFileError extends Error {
  readonly code = "DUPLICATE_ROWS_IN_FILE" as const;

  constructor(message: string) {
    super(message);
    this.name = "DuplicateRowsInFileError";
  }
}

/**
 * Throws when a weekly file has repeated platform IDs or exact clone rows.
 * Empty courier IDs are ignored for the platform-ID rule.
 */
export function assertNoDuplicatePlatformIdsInWeeklyFile(rows: NormalizedEarningsRow[]): void {
  const courierDups = findDuplicateCourierIds(rows);
  if (courierDups.length > 0) {
    throw new DuplicateRowsInFileError(duplicateCourierIdsMessage(courierDups));
  }
  const exactDups = findExactDuplicateRows(rows);
  if (exactDups.length > 0) {
    throw new DuplicateRowsInFileError(exactDuplicateRowsMessage(exactDups));
  }
}
