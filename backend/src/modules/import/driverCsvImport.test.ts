import { describe, expect, it } from "vitest";
import {
  buildDriverColumnMap,
  isDriverCsvRowDataEmpty,
  rowToDriverCsvRow,
  validateDriverCsvRow,
} from "./driverCsvImport";
import { parseAndFilterEntityCsv } from "../../lib/parseEntityCsv";

describe("driverCsvImport validation", () => {
  it("maps export-compatible headers", () => {
    const colMap = buildDriverColumnMap(["First name", "Last name", "Phone", "Status"]);
    const row = rowToDriverCsvRow(["Ana", "Pop", "0711111111", "active"], colMap);
    expect(row.firstName).toBe("Ana");
    expect(row.lastName).toBe("Pop");
    expect(row.phone).toBe("0711111111");
    expect(validateDriverCsvRow(row)).toBeNull();
  });

  it("rejects rows missing phone", () => {
    const colMap = buildDriverColumnMap(["First name", "Last name", "Phone"]);
    const row = rowToDriverCsvRow(["Ana", "Pop", ""], colMap);
    expect(validateDriverCsvRow(row)).toBe("missing phone");
  });

  it("treats all-empty mapped rows as empty data, not invalid", () => {
    const colMap = buildDriverColumnMap(["First name", "Last name", "Phone"]);
    const row = rowToDriverCsvRow(["", "", ""], colMap);
    expect(isDriverCsvRowDataEmpty(row)).toBe(true);
    expect(validateDriverCsvRow(row)).toBe("missing firstName");
  });

  it("filters empty rows before mapping", () => {
    const csv = [
      "First name,Last name,Phone",
      "Ana,Pop,0711111111",
      ",,",
      "",
    ].join("\n");
    const { table, stats } = parseAndFilterEntityCsv(Buffer.from(csv, "utf8"));
    expect(table.rows).toHaveLength(1);
    expect(stats.emptyRowsSkipped).toBe(1);
  });
});
