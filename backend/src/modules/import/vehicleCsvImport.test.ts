import { describe, expect, it } from "vitest";
import {
  buildVehicleColumnMap,
  rowToVehicleCsvRow,
  validateVehicleCsvRow,
} from "./vehicleCsvImport";
import { parseAndFilterEntityCsv } from "../../lib/parseEntityCsv";

describe("vehicleCsvImport validation", () => {
  it("maps export-compatible headers and parses vehicle display name", () => {
    const colMap = buildVehicleColumnMap([
      "Vehicle",
      "Type",
      "License plate",
      "Status",
    ]);
    const row = rowToVehicleCsvRow(["Toyota Corolla", "Car", "B-123-ABC", "available"], colMap);
    expect(row.make).toBe("Toyota");
    expect(row.model).toBe("Corolla");
    expect(row.vehicleType).toBe("car");
    expect(row.licensePlate).toBe("B-123-ABC");
    expect(validateVehicleCsvRow(row)).toBeNull();
  });

  it("rejects rows missing license plate", () => {
    const colMap = buildVehicleColumnMap(["Make", "Model", "Type", "License plate"]);
    const row = rowToVehicleCsvRow(["Toyota", "Corolla", "car", ""], colMap);
    expect(validateVehicleCsvRow(row)).toBe("missing licensePlate");
  });

  it("filters blank lines and comma-only rows", () => {
    const csv = [
      "Vehicle,Type,License plate",
      "Toyota Corolla,Car,B-123-ABC",
      ",,",
      "",
    ].join("\n");
    const { table, stats } = parseAndFilterEntityCsv(Buffer.from(csv, "utf8"));
    expect(table.rows).toHaveLength(1);
    expect(stats.emptyRowsSkipped + stats.emptyLinesSkipped).toBeGreaterThan(0);
  });
});
