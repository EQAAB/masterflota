import { describe, expect, it, vi } from "vitest";

vi.mock("pdf-parse", () => ({ default: vi.fn() }));

import { combinedEmptyRowsSkipped, filterParsedTable, isRowAllEmpty } from "./filterParsedRows";
import { parseDelimitedText } from "./parseCsvTable";
import { parseAndFilterEntityCsv } from "./parseEntityCsv";
import { parseEarningsFile } from "../modules/earnings/parseFile";

describe("isRowAllEmpty", () => {
  it("returns true for all-empty cells", () => {
    expect(isRowAllEmpty(["", "", ""])).toBe(true);
  });

  it("returns true for whitespace-only cells", () => {
    expect(isRowAllEmpty(["  ", "\t", ""])).toBe(true);
  });

  it("returns false when any cell has content", () => {
    expect(isRowAllEmpty(["", "x", ""])).toBe(false);
  });
});

describe("filterParsedTable", () => {
  it("removes all-empty rows and counts skips", () => {
    const { table, stats } = filterParsedTable(
      {
        headers: ["a", "b"],
        rows: [
          ["1", "2"],
          ["", ""],
          [" ", "\t"],
          ["3", "4"],
        ],
      },
      { emptyLinesSkipped: 3 },
    );

    expect(table.rows).toHaveLength(2);
    expect(stats.rawDataRowCount).toBe(4);
    expect(stats.emptyLinesSkipped).toBe(3);
    expect(stats.emptyRowsSkipped).toBe(2);
    expect(stats.dataRowsParsed).toBe(2);
    expect(combinedEmptyRowsSkipped(stats)).toBe(5);
  });
});

describe("parseAndFilterEntityCsv", () => {
  it("skips trailing blank lines and all-empty comma rows", () => {
    const csv = [
      "First name,Last name,Phone",
      "Jane,Doe,0712345678",
      "John,Smith,0798765432",
      ",,",
      ", ,",
      "",
      "   ",
      "",
    ].join("\n");

    const { table, stats } = parseAndFilterEntityCsv(Buffer.from(csv, "utf8"));
    expect(table.rows).toHaveLength(2);
    expect(stats.emptyLinesSkipped).toBe(3);
    expect(stats.emptyRowsSkipped).toBe(2);
    expect(combinedEmptyRowsSkipped(stats)).toBe(5);
  });
});

describe("parseEarningsFile CSV empty lines", () => {
  it("skips trailing blank lines and all-empty comma rows", async () => {
    const csv = [
      "ID,Venituri,Total",
      "1,100,90",
      "2,200,180",
      ",,",
      ", ,",
      "",
      "   ",
      "",
    ].join("\n");

    const parsed = await parseEarningsFile(Buffer.from(csv, "utf8"), "test.csv");
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.parseStats.emptyLinesSkipped).toBe(3);
    expect(parsed.parseStats.emptyRowsSkipped).toBe(2);
    expect(parsed.parseStats.dataRowsParsed).toBe(2);
    expect(parsed.parseStats.rawDataRowCount).toBe(4);
  });
});

describe("parseDelimitedText", () => {
  it("parses semicolon-delimited files", () => {
    const { table } = parseDelimitedText("a;b\nc;d");
    expect(table.headers).toEqual(["a", "b"]);
    expect(table.rows).toEqual([["c", "d"]]);
  });
});
