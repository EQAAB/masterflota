import type { PoolClient } from "pg";
import { isEmptyRow } from "../../lib/isEmptyRow";
import { buildColumnIndexMap, cellAt } from "../../lib/csvHeaderMap";
import type { ParseFilterStats } from "../../lib/filterParsedRows";
import type { ParsedTable } from "../../lib/parseCsvTable";
import { buildCsvImportSummary, type CsvImportSummary } from "./csvImportTypes";

function parseVehicleDisplayName(display: string): { make: string; model: string } | null {
  const t = display.trim();
  if (!t) return null;
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { make: parts[0], model: parts[0] };
  return { make: parts[0], model: parts.slice(1).join(" ") };
}

const VEHICLE_HEADER_ALIASES: Record<string, string> = {
  vehicle: "vehicleDisplay",
  type: "vehicleType",
  vehicletype: "vehicleType",
  licenseplate: "licensePlate",
  vin: "vin",
  status: "status",
  dailyrent: "dailyRent",
  weeklyrent: "weeklyRent",
  monthlyrent: "monthlyRent",
  make: "make",
  model: "model",
  year: "year",
  color: "color",
  notes: "notes",
};

const VALID_VEHICLE_STATUSES = new Set(["available", "rented", "maintenance", "sold", "scrapped"]);

function normalizeVehicleType(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (!t) return "other";
  if (/(cycle|bicycle|bike|ebike)/.test(t)) return "cycle";
  if (/(scooter|moped|vespa)/.test(t)) return "scooter";
  if (/(van|minivan|bus)/.test(t)) return "van";
  if (/(car|sedan|suv|hatchback|pickup|truck)/.test(t)) return "car";
  if (["car", "scooter", "cycle", "van", "other"].includes(t)) return t;
  return "other";
}

export type VehicleCsvRow = {
  vehicleType: string;
  make: string;
  model: string;
  licensePlate: string;
  vin: string | null;
  status: string;
  dailyRent: number;
  weeklyRent: number;
  monthlyRent: number;
  year: number | null;
  color: string | null;
  notes: string | null;
};

export function buildVehicleColumnMap(headers: string[]): Record<string, number> {
  return buildColumnIndexMap(headers, VEHICLE_HEADER_ALIASES);
}

function parseMoney(raw: string): number {
  const t = raw.trim();
  if (!t) return 0;
  const n = parseFloat(t.replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

export function rowToVehicleCsvRow(cells: string[], colMap: Record<string, number>): VehicleCsvRow {
  let make = cellAt(cells, colMap, "make");
  let model = cellAt(cells, colMap, "model");
  if (!make || !model) {
    const parsed = parseVehicleDisplayName(cellAt(cells, colMap, "vehicleDisplay"));
    if (parsed) {
      if (!make) make = parsed.make;
      if (!model) model = parsed.model;
    }
  }

  const typeRaw = cellAt(cells, colMap, "vehicleType");
  const statusRaw = cellAt(cells, colMap, "status").toLowerCase();
  const status = statusRaw && VALID_VEHICLE_STATUSES.has(statusRaw) ? statusRaw : "available";

  const yearRaw = cellAt(cells, colMap, "year");
  let year: number | null = null;
  if (yearRaw) {
    const y = parseInt(yearRaw, 10);
    if (!Number.isNaN(y)) year = y;
  }

  return {
    vehicleType: normalizeVehicleType(typeRaw),
    make,
    model,
    licensePlate: cellAt(cells, colMap, "licensePlate"),
    vin: cellAt(cells, colMap, "vin") || null,
    status,
    dailyRent: parseMoney(cellAt(cells, colMap, "dailyRent")),
    weeklyRent: parseMoney(cellAt(cells, colMap, "weeklyRent")),
    monthlyRent: parseMoney(cellAt(cells, colMap, "monthlyRent")),
    year,
    color: cellAt(cells, colMap, "color") || null,
    notes: cellAt(cells, colMap, "notes") || null,
  };
}

export function validateVehicleCsvRow(row: VehicleCsvRow): string | null {
  if (!row.vehicleType.trim()) return "missing vehicleType";
  if (!row.make.trim()) return "missing make";
  if (!row.model.trim()) return "missing model";
  if (!row.licensePlate.trim()) return "missing licensePlate";
  if (row.status && !VALID_VEHICLE_STATUSES.has(row.status)) return "invalid status";
  return null;
}

export function isVehicleCsvRowDataEmpty(row: VehicleCsvRow): boolean {
  return isEmptyRow([
    row.make,
    row.model,
    row.licensePlate,
    row.vin,
    row.color,
    row.notes,
  ]);
}

export async function importVehiclesFromCsvTable(
  client: PoolClient,
  orgId: string,
  table: ParsedTable,
  stats: ParseFilterStats,
): Promise<CsvImportSummary> {
  if (!table.headers.length) {
    throw new Error("CSV file has no header row");
  }

  const colMap = buildVehicleColumnMap(table.headers);
  let imported = 0;
  let invalidRowsSkipped = 0;
  let extraEmptyRowsSkipped = 0;

  const seenPlates = new Set<string>();
  const { rows: existingPlates } = await client.query<{ license_plate: string }>(
    `SELECT license_plate FROM vehicles WHERE organization_id = $1::uuid`,
    [orgId],
  );
  for (const r of existingPlates) {
    seenPlates.add(r.license_plate.trim().toLowerCase());
  }

  for (const cells of table.rows) {
    if (isEmptyRow(cells)) {
      extraEmptyRowsSkipped += 1;
      continue;
    }
    const row = rowToVehicleCsvRow(cells, colMap);
    if (isVehicleCsvRowDataEmpty(row)) {
      extraEmptyRowsSkipped += 1;
      continue;
    }
    const validationError = validateVehicleCsvRow(row);
    if (validationError) {
      invalidRowsSkipped += 1;
      continue;
    }

    const plateKey = row.licensePlate.trim().toLowerCase();
    if (seenPlates.has(plateKey)) {
      invalidRowsSkipped += 1;
      continue;
    }
    seenPlates.add(plateKey);

    await client.query(
      `INSERT INTO vehicles (
        organization_id, vehicle_type, make, model, year, color, license_plate, vin,
        daily_rent, weekly_rent, monthly_rent, status, notes
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )`,
      [
        orgId,
        row.vehicleType,
        row.make,
        row.model,
        row.year,
        row.color,
        row.licensePlate.trim(),
        row.vin,
        row.dailyRent,
        row.weeklyRent,
        row.monthlyRent,
        row.status,
        row.notes,
      ],
    );
    imported += 1;
  }

  return buildCsvImportSummary(stats, imported, invalidRowsSkipped, extraEmptyRowsSkipped);
}
