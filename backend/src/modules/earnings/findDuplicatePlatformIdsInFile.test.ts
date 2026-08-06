import { describe, expect, it } from "vitest";
import type { NormalizedEarningsRow } from "./normalizeRow";
import {
  assertNoDuplicatePlatformIdsInWeeklyFile,
  DuplicateRowsInFileError,
  findDuplicateCourierIds,
  findExactDuplicateRows,
  mergeDuplicatePlatformIdsInWeeklyFile,
  prepareWeeklyImportRows,
} from "./findDuplicatePlatformIdsInFile";

function row(partial: {
  courierId?: string;
  phone?: string;
  plate?: string;
  tripDateIso?: string | null;
  gross?: number | null;
  net?: number | null;
}): NormalizedEarningsRow {
  return {
    tripDateIso: partial.tripDateIso ?? "2026-05-11",
    hints: {
      courierId: partial.courierId,
      phone: partial.phone,
      plate: partial.plate,
    },
    amounts: {
      gross: partial.gross ?? 100,
      net: partial.net ?? 80,
      platformFee: null,
      transferTotal: null,
      dailyCash: null,
      accountOpeningFee: null,
      tripCount: null,
    },
    rawSample: {},
  };
}

describe("findDuplicateCourierIds", () => {
  it("returns empty when all courier IDs are unique", () => {
    expect(
      findDuplicateCourierIds([row({ courierId: "A1" }), row({ courierId: "B2" })]),
    ).toEqual([]);
  });

  it("detects case-insensitive duplicates and keeps display casing", () => {
    const dups = findDuplicateCourierIds([
      row({ courierId: "Abc-1" }),
      row({ courierId: "abc-1" }),
      row({ courierId: "C3" }),
    ]);
    expect(dups).toHaveLength(1);
    expect(dups[0].courierId).toBe("Abc-1");
    expect(dups[0].count).toBe(2);
    expect(dups[0].rowNumbers).toEqual([1, 2]);
  });

  it("ignores blank courier IDs", () => {
    expect(
      findDuplicateCourierIds([row({ courierId: "" }), row({ courierId: "  " }), row({ courierId: "X" })]),
    ).toEqual([]);
  });
});

describe("findExactDuplicateRows", () => {
  it("detects identical identifier/date/amount rows", () => {
    const dups = findExactDuplicateRows([
      row({ courierId: "A", gross: 10, net: 5 }),
      row({ courierId: "A", gross: 10, net: 5 }),
    ]);
    expect(dups).toHaveLength(1);
    expect(dups[0].count).toBe(2);
  });
});

describe("mergeDuplicatePlatformIdsInWeeklyFile", () => {
  it("sums earnings for month-split rows with the same platform ID", () => {
    const { rows, mergedRowCount } = mergeDuplicatePlatformIdsInWeeklyFile([
      row({ courierId: "2311096", gross: 100, net: 80 }),
      row({ courierId: "2311096", gross: 50, net: 40 }),
      row({ courierId: "999", gross: 10, net: 8 }),
    ]);
    expect(rows).toHaveLength(2);
    expect(mergedRowCount).toBe(1);
    const merged = rows.find((r) => r.hints.courierId === "2311096");
    expect(merged?.amounts.gross).toBe(150);
    expect(merged?.amounts.net).toBe(120);
  });

  it("does not double-count exact clone rows for the same platform ID", () => {
    const { rows } = mergeDuplicatePlatformIdsInWeeklyFile([
      row({ courierId: "A", gross: 100, net: 80 }),
      row({ courierId: "A", gross: 100, net: 80 }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.amounts.gross).toBe(100);
    expect(rows[0]!.amounts.net).toBe(80);
  });

  it("merges case-insensitive platform IDs", () => {
    const { rows } = mergeDuplicatePlatformIdsInWeeklyFile([
      row({ courierId: "Abc-1", gross: 10, net: 8 }),
      row({ courierId: "abc-1", gross: 5, net: 4 }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.amounts.gross).toBe(15);
  });
});

describe("prepareWeeklyImportRows", () => {
  it("returns merge warning for duplicate platform IDs", () => {
    const result = prepareWeeklyImportRows([
      row({ courierId: "DUP", gross: 10, net: 8 }),
      row({ courierId: "DUP", gross: 5, net: 4 }),
    ]);
    expect(result.rows).toHaveLength(1);
    expect(result.mergeWarning).toMatch(/Merged 1 row/);
    expect(result.mergedDriverCount).toBe(1);
  });

  it("throws for exact duplicate rows without a platform ID", () => {
    expect(() =>
      prepareWeeklyImportRows([
        row({ courierId: undefined, gross: 10, net: 5 }),
        row({ courierId: undefined, gross: 10, net: 5 }),
      ]),
    ).toThrow(DuplicateRowsInFileError);
  });
});

describe("assertNoDuplicatePlatformIdsInWeeklyFile", () => {
  it("allows duplicate platform IDs (merged automatically)", () => {
    expect(() =>
      assertNoDuplicatePlatformIdsInWeeklyFile([row({ courierId: "DUP" }), row({ courierId: "DUP" })]),
    ).not.toThrow();
  });

  it("allows unique IDs", () => {
    expect(() =>
      assertNoDuplicatePlatformIdsInWeeklyFile([row({ courierId: "A" }), row({ courierId: "B" })]),
    ).not.toThrow();
  });
});
