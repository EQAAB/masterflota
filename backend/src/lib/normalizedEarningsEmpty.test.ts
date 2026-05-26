import { describe, expect, it } from "vitest";
import {
  filterEmptyNormalizedEarningsRows,
  isNormalizedEarningsRowEmpty,
  rowCellsToNormalized,
} from "../modules/earnings/normalizeRow";

describe("isNormalizedEarningsRowEmpty", () => {
  it("treats filename-only trip date as empty", () => {
    const row = rowCellsToNormalized([], new Map(), "2026-04-01");
    expect(row.tripDateIso).toBe("2026-04-01");
    expect(isNormalizedEarningsRowEmpty(row)).toBe(true);
  });

  it("detects rows with mapped courier data as non-empty", () => {
    const colMap = new Map<number, "courier_id" | "gross">([
      [0, "courier_id"],
      [1, "gross"],
    ]);
    const row = rowCellsToNormalized(["123", "100"], colMap, null);
    expect(isNormalizedEarningsRowEmpty(row)).toBe(false);
  });
});

describe("filterEmptyNormalizedEarningsRows", () => {
  it("removes empty normalized rows before staging", () => {
    const colMap = new Map<number, "courier_id" | "gross">([
      [0, "courier_id"],
      [1, "gross"],
    ]);
    const rows = [
      rowCellsToNormalized(["123", "50"], colMap, null),
      rowCellsToNormalized([], new Map(), "2026-04-01"),
      rowCellsToNormalized(["", ""], colMap, null),
    ];
    const { rows: kept, emptyRowsSkipped } = filterEmptyNormalizedEarningsRows(rows);
    expect(kept).toHaveLength(1);
    expect(emptyRowsSkipped).toBe(2);
  });
});
