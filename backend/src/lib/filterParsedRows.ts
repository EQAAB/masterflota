import type { ParsedTable } from "./parseCsvTable";
import { isEmptyRow, trimParsedTable } from "./isEmptyRow";

export type ParseFilterStats = {
  /** Data rows before all-empty cell filter (header excluded). */
  rawDataRowCount: number;
  /** Blank physical lines skipped during CSV parse. */
  emptyLinesSkipped: number;
  /** Rows where every cell is empty/whitespace. */
  emptyRowsSkipped: number;
  /** Rows kept after filtering. */
  dataRowsParsed: number;
};

/** @deprecated Use {@link isEmptyRow} from `./isEmptyRow` */
export function isRowAllEmpty(cells: string[]): boolean {
  return isEmptyRow(cells);
}

export function filterParsedTable(
  table: ParsedTable,
  opts?: { emptyLinesSkipped?: number },
): { table: ParsedTable; stats: ParseFilterStats } {
  const emptyLinesSkipped = opts?.emptyLinesSkipped ?? 0;
  const trimmed = trimParsedTable(table);
  const rawDataRowCount = trimmed.rows.length;
  const rows = trimmed.rows.filter((cells) => !isEmptyRow(cells));
  const emptyRowsSkipped = rawDataRowCount - rows.length;

  return {
    table: { headers: trimmed.headers, rows },
    stats: {
      rawDataRowCount,
      emptyLinesSkipped,
      emptyRowsSkipped,
      dataRowsParsed: rows.length,
    },
  };
}

export function totalLinesInFile(stats: ParseFilterStats): number {
  return stats.rawDataRowCount + stats.emptyLinesSkipped;
}

export function combinedEmptyRowsSkipped(stats: ParseFilterStats): number {
  return stats.emptyLinesSkipped + stats.emptyRowsSkipped;
}
