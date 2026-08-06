import type { NormalizedAmounts, NormalizedEarningsRow, RowHints } from "./normalizeRow";

export type WeeklyImportPrepareResult = {
  rows: NormalizedEarningsRow[];
  /** Non-null when duplicate platform IDs were merged (e.g. month-split files combined). */
  mergeWarning: string | null;
  mergedDriverCount: number;
  mergedRowCount: number;
};

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

export function mergedCourierIdsWarningMessage(
  dups: DuplicateCourierIdGroup[],
  mergedRowCount: number,
): string {
  const sample = dups.slice(0, 3).map((d) => `"${d.courierId}" (${d.count} rows)`);
  const extra = dups.length > 3 ? ` and ${dups.length - 3} more drivers` : "";
  return `Merged ${mergedRowCount} row(s) for ${dups.length} platform ID(s) (${sample.join(", ")}${extra}). Typical when month-split platform exports are combined into one file — earnings amounts were summed per driver.`;
}

function sumNullable(
  a: number | null | undefined,
  b: number | null | undefined,
): number | null {
  const hasA = a != null && Number.isFinite(a);
  const hasB = b != null && Number.isFinite(b);
  if (!hasA && !hasB) return null;
  return (hasA ? a! : 0) + (hasB ? b! : 0);
}

function mergeAmounts(a: NormalizedAmounts, b: NormalizedAmounts): NormalizedAmounts {
  const tripA = a.tripCount;
  const tripB = b.tripCount;
  const tripSum = sumNullable(tripA, tripB);
  return {
    gross: sumNullable(a.gross, b.gross),
    net: sumNullable(a.net, b.net),
    platformFee: sumNullable(a.platformFee, b.platformFee),
    transferTotal: sumNullable(a.transferTotal, b.transferTotal),
    dailyCash: sumNullable(a.dailyCash, b.dailyCash),
    accountOpeningFee: sumNullable(a.accountOpeningFee, b.accountOpeningFee),
    tripCount: tripSum === null ? null : Math.round(tripSum),
    tips: sumNullable(a.tips, b.tips),
    boltAdjustedWithoutVat: sumNullable(a.boltAdjustedWithoutVat, b.boltAdjustedWithoutVat),
    boltTipsWithoutVat: sumNullable(a.boltTipsWithoutVat, b.boltTipsWithoutVat),
    receivedTotal: sumNullable(a.receivedTotal, b.receivedTotal),
    castigurileTale: sumNullable(a.castigurileTale, b.castigurileTale),
    platformMetadata: { ...a.platformMetadata, ...b.platformMetadata },
  };
}

function pickHint(a: string | undefined, b: string | undefined): string | undefined {
  const ta = a?.trim();
  const tb = b?.trim();
  return ta || tb || undefined;
}

function mergeHints(a: RowHints, b: RowHints): RowHints {
  return {
    courierId: pickHint(a.courierId, b.courierId),
    phone: pickHint(a.phone, b.phone),
    plate: pickHint(a.plate, b.plate),
    driverName: pickHint(a.driverName, b.driverName),
  };
}

function latestDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

function mergeTwoRows(a: NormalizedEarningsRow, b: NormalizedEarningsRow): NormalizedEarningsRow {
  return {
    tripDateIso: latestDate(a.tripDateIso, b.tripDateIso),
    hints: mergeHints(a.hints, b.hints),
    amounts: mergeAmounts(a.amounts, b.amounts),
    rawSample: { ...a.rawSample, ...b.rawSample },
  };
}

/** Fingerprint for identical earnings rows (accidental paste within same courier). */
function amountFingerprint(row: NormalizedEarningsRow): string {
  const a = row.amounts;
  return [
    row.tripDateIso ?? "",
    a.gross ?? "",
    a.net ?? "",
    a.tips ?? "",
    a.boltAdjustedWithoutVat ?? "",
    a.boltTipsWithoutVat ?? "",
    a.dailyCash ?? "",
    a.transferTotal ?? "",
    a.receivedTotal ?? "",
    a.castigurileTale ?? "",
    a.platformFee ?? "",
    a.accountOpeningFee ?? "",
  ].join("|");
}

/** Merge rows sharing a platform ID: sum distinct amount rows; skip exact clones. */
function mergeCourierRows(rows: NormalizedEarningsRow[]): NormalizedEarningsRow {
  const seen = new Set<string>();
  let merged: NormalizedEarningsRow | null = null;
  for (const row of rows) {
    const fp = amountFingerprint(row);
    if (seen.has(fp)) continue;
    seen.add(fp);
    merged = merged ? mergeTwoRows(merged, row) : { ...row, hints: { ...row.hints }, amounts: { ...row.amounts } };
  }
  return merged ?? rows[0]!;
}

/**
 * Combine duplicate platform IDs into one row per driver (month-split merged files).
 * Rows without a platform ID are kept as-is.
 */
export function mergeDuplicatePlatformIdsInWeeklyFile(rows: NormalizedEarningsRow[]): {
  rows: NormalizedEarningsRow[];
  mergedGroups: DuplicateCourierIdGroup[];
  mergedRowCount: number;
} {
  const mergedGroups = findDuplicateCourierIds(rows);
  if (mergedGroups.length === 0) {
    return { rows, mergedGroups: [], mergedRowCount: 0 };
  }

  const groups = new Map<string, NormalizedEarningsRow[]>();
  const noIdRows: NormalizedEarningsRow[] = [];

  for (const row of rows) {
    const key = normalizeCourierId(row.hints.courierId);
    if (!key) {
      noIdRows.push(row);
      continue;
    }
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const merged: NormalizedEarningsRow[] = [];
  for (const [, group] of groups) {
    merged.push(group.length === 1 ? group[0]! : mergeCourierRows(group));
  }

  const mergedRowCount = mergedGroups.reduce((sum, g) => sum + (g.count - 1), 0);
  return { rows: [...merged, ...noIdRows], mergedGroups, mergedRowCount };
}

/** Merge duplicate platform IDs, then reject remaining exact clone rows (no platform ID). */
export function prepareWeeklyImportRows(rows: NormalizedEarningsRow[]): WeeklyImportPrepareResult {
  const { rows: mergedRows, mergedGroups, mergedRowCount } =
    mergeDuplicatePlatformIdsInWeeklyFile(rows);

  const exactDups = findExactDuplicateRows(mergedRows);
  if (exactDups.length > 0) {
    throw new DuplicateRowsInFileError(exactDuplicateRowsMessage(exactDups));
  }

  return {
    rows: mergedRows,
    mergeWarning:
      mergedGroups.length > 0
        ? mergedCourierIdsWarningMessage(mergedGroups, mergedRowCount)
        : null,
    mergedDriverCount: mergedGroups.length,
    mergedRowCount,
  };
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
 * @deprecated Prefer {@link prepareWeeklyImportRows} (auto-merges duplicate platform IDs).
 * Throws only for exact clone rows after merge would apply.
 */
export function assertNoDuplicatePlatformIdsInWeeklyFile(rows: NormalizedEarningsRow[]): void {
  prepareWeeklyImportRows(rows);
}
