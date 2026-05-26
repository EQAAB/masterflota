/** True when a single CSV cell / field value is empty, null, or whitespace-only. */
export function isEmptyCellValue(value: unknown): boolean {
  return String(value ?? "").trim() === "";
}

/**
 * True when every value in a row object or cell array is empty/null/whitespace.
 * Reusable across CSV parsers, entity importers, and earnings normalization.
 */
export function isEmptyRow(row: Record<string, unknown> | readonly unknown[]): boolean {
  const values = Array.isArray(row) ? row : Object.values(row);
  if (!values.length) return true;
  return values.every(isEmptyCellValue);
}

/** Trim every cell in a parsed CSV row. */
export function trimCsvCells(cells: string[]): string[] {
  return cells.map((c) => String(c ?? "").trim());
}

/** Trim headers and all data rows in a parsed table. */
export function trimParsedTable<T extends { headers: string[]; rows: string[][] }>(table: T): T {
  return {
    ...table,
    headers: table.headers.map((h) => String(h ?? "").trim()),
    rows: table.rows.map(trimCsvCells),
  };
}
