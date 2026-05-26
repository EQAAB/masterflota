import type { ParseFilterStats } from "../../lib/filterParsedRows";
import { combinedEmptyRowsSkipped, totalLinesInFile } from "../../lib/filterParsedRows";

export type CsvImportSummary = {
  imported: number;
  emptyRowsSkipped: number;
  invalidRowsSkipped: number;
  totalLinesInFile: number;
};

export function buildCsvImportSummary(
  stats: ParseFilterStats,
  imported: number,
  invalidRowsSkipped: number,
  extraEmptyRowsSkipped = 0,
): CsvImportSummary {
  return {
    imported,
    emptyRowsSkipped: combinedEmptyRowsSkipped(stats) + extraEmptyRowsSkipped,
    invalidRowsSkipped,
    totalLinesInFile: totalLinesInFile(stats),
  };
}
