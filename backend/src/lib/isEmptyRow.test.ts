import { describe, expect, it } from "vitest";
import { isEmptyCellValue, isEmptyRow, trimCsvCells } from "./isEmptyRow";

describe("isEmptyRow", () => {
  it("returns true for empty object values", () => {
    expect(isEmptyRow({ a: "", b: "  ", c: null })).toBe(true);
  });

  it("returns false when any field has content", () => {
    expect(isEmptyRow({ a: "", b: "x" })).toBe(false);
  });

  it("returns true for empty cell arrays", () => {
    expect(isEmptyRow(["", " ", "\t"])).toBe(true);
  });

  it("returns false for arrays with content", () => {
    expect(isEmptyRow(["", "1"])).toBe(false);
  });
});

describe("isEmptyCellValue", () => {
  it("handles null and undefined", () => {
    expect(isEmptyCellValue(null)).toBe(true);
    expect(isEmptyCellValue(undefined)).toBe(true);
  });
});

describe("trimCsvCells", () => {
  it("trims whitespace from cells", () => {
    expect(trimCsvCells(["  a ", "\tb"])).toEqual(["a", "b"]);
  });
});
