import { describe, expect, it } from "vitest";
import type { NormalizedEarningsRow } from "./normalizeRow";
import {
  assertNoDuplicatePlatformIdsInWeeklyFile,
  DuplicateRowsInFileError,
  findDuplicateCourierIds,
  findExactDuplicateRows,
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

describe("assertNoDuplicatePlatformIdsInWeeklyFile", () => {
  it("throws for duplicate platform IDs", () => {
    expect(() =>
      assertNoDuplicatePlatformIdsInWeeklyFile([row({ courierId: "DUP" }), row({ courierId: "DUP" })]),
    ).toThrow(DuplicateRowsInFileError);
  });

  it("allows unique IDs", () => {
    expect(() =>
      assertNoDuplicatePlatformIdsInWeeklyFile([row({ courierId: "A" }), row({ courierId: "B" })]),
    ).not.toThrow();
  });
});
