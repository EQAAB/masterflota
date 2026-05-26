import { filterParsedTable, type ParseFilterStats } from "./filterParsedRows";
import { parseDelimitedText, type ParsedTable } from "./parseCsvTable";

export type ParsedEntityCsv = {
  table: ParsedTable;
  stats: ParseFilterStats;
};

export function parseAndFilterEntityCsv(buffer: Buffer): ParsedEntityCsv {
  const { table, emptyLinesSkipped } = parseDelimitedText(buffer.toString("utf8"));
  const { table: filtered, stats } = filterParsedTable(table, { emptyLinesSkipped });
  return { table: filtered, stats };
}
