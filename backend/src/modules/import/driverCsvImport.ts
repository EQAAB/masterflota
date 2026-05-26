import type { PoolClient } from "pg";
import { isEmptyRow } from "../../lib/isEmptyRow";
import { buildColumnIndexMap, cellAt } from "../../lib/csvHeaderMap";
import type { ParseFilterStats } from "../../lib/filterParsedRows";
import type { ParsedTable } from "../../lib/parseCsvTable";
import { buildCsvImportSummary, type CsvImportSummary } from "./csvImportTypes";

const DRIVER_HEADER_ALIASES: Record<string, string> = {
  firstname: "firstName",
  lastname: "lastName",
  phone: "phone",
  email: "email",
  status: "employmentStatus",
  employmentstatus: "employmentStatus",
  commission: "commissionRate",
  commissionrate: "commissionRate",
  uberid: "uberDriverId",
  boltid: "boltDriverId",
  glovoid: "glovoCourierId",
  "glovocourierid": "glovoCourierId",
  boltcourierid: "boltCourierId",
  woltid: "woltCourierId",
  licensenumber: "licenseNumber",
  notes: "notes",
};

const VALID_EMPLOYMENT_STATUSES = new Set(["active", "inactive", "suspended", "terminated"]);

export type DriverCsvRow = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  employmentStatus: string;
  commissionRate: number | null;
  uberDriverId: string | null;
  boltDriverId: string | null;
  glovoCourierId: string | null;
  boltCourierId: string | null;
  woltCourierId: string | null;
  licenseNumber: string | null;
  notes: string | null;
};

export function buildDriverColumnMap(headers: string[]): Record<string, number> {
  return buildColumnIndexMap(headers, DRIVER_HEADER_ALIASES);
}

export function rowToDriverCsvRow(cells: string[], colMap: Record<string, number>): DriverCsvRow {
  const commissionRaw = cellAt(cells, colMap, "commissionRate");
  let commissionRate: number | null = null;
  if (commissionRaw) {
    const n = parseFloat(commissionRaw.replace(",", "."));
    if (!Number.isNaN(n)) commissionRate = n;
  }

  const statusRaw = cellAt(cells, colMap, "employmentStatus").toLowerCase();
  const employmentStatus = statusRaw && VALID_EMPLOYMENT_STATUSES.has(statusRaw) ? statusRaw : "active";

  return {
    firstName: cellAt(cells, colMap, "firstName"),
    lastName: cellAt(cells, colMap, "lastName"),
    phone: cellAt(cells, colMap, "phone"),
    email: cellAt(cells, colMap, "email") || null,
    employmentStatus,
    commissionRate,
    uberDriverId: cellAt(cells, colMap, "uberDriverId") || null,
    boltDriverId: cellAt(cells, colMap, "boltDriverId") || null,
    glovoCourierId: cellAt(cells, colMap, "glovoCourierId") || null,
    boltCourierId: cellAt(cells, colMap, "boltCourierId") || null,
    woltCourierId: cellAt(cells, colMap, "woltCourierId") || null,
    licenseNumber: cellAt(cells, colMap, "licenseNumber") || null,
    notes: cellAt(cells, colMap, "notes") || null,
  };
}

export function validateDriverCsvRow(row: DriverCsvRow): string | null {
  if (!row.firstName.trim()) return "missing firstName";
  if (!row.lastName.trim()) return "missing lastName";
  if (!row.phone.trim()) return "missing phone";
  if (row.employmentStatus && !VALID_EMPLOYMENT_STATUSES.has(row.employmentStatus)) {
    return "invalid employmentStatus";
  }
  return null;
}

export function isDriverCsvRowDataEmpty(row: DriverCsvRow): boolean {
  return (
    isEmptyRow([
      row.firstName,
      row.lastName,
      row.phone,
      row.email,
      row.licenseNumber,
      row.notes,
      row.uberDriverId,
      row.boltDriverId,
      row.glovoCourierId,
      row.boltCourierId,
      row.woltCourierId,
    ]) && row.commissionRate == null
  );
}

export async function importDriversFromCsvTable(
  client: PoolClient,
  orgId: string,
  table: ParsedTable,
  stats: ParseFilterStats,
): Promise<CsvImportSummary> {
  if (!table.headers.length) {
    throw new Error("CSV file has no header row");
  }

  const colMap = buildDriverColumnMap(table.headers);
  let imported = 0;
  let invalidRowsSkipped = 0;
  let extraEmptyRowsSkipped = 0;

  const seenLicenseNumbers = new Set<string>();
  const { rows: existingLicense } = await client.query<{ license_number: string }>(
    `SELECT license_number FROM drivers
     WHERE organization_id = $1::uuid AND license_number IS NOT NULL AND license_number <> ''`,
    [orgId],
  );
  for (const r of existingLicense) {
    if (r.license_number) seenLicenseNumbers.add(r.license_number.trim().toLowerCase());
  }

  for (const cells of table.rows) {
    if (isEmptyRow(cells)) {
      extraEmptyRowsSkipped += 1;
      continue;
    }
    const row = rowToDriverCsvRow(cells, colMap);
    if (isDriverCsvRowDataEmpty(row)) {
      extraEmptyRowsSkipped += 1;
      continue;
    }
    const validationError = validateDriverCsvRow(row);
    if (validationError) {
      invalidRowsSkipped += 1;
      continue;
    }

    if (row.licenseNumber) {
      const key = row.licenseNumber.trim().toLowerCase();
      if (seenLicenseNumbers.has(key)) {
        invalidRowsSkipped += 1;
        continue;
      }
      seenLicenseNumbers.add(key);
    }

    await client.query(
      `INSERT INTO drivers (
        organization_id, first_name, last_name, email, phone, employment_status,
        commission_rate, base_commission_rate, uber_driver_id, bolt_driver_id,
        glovo_courier_id, bolt_courier_id, wolt_courier_id, license_number, notes
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6,
        COALESCE($7, 10.0), COALESCE($7, 10.0),
        $8, $9, $10, $11, $12, $13, $14
      )`,
      [
        orgId,
        row.firstName,
        row.lastName,
        row.email,
        row.phone,
        row.employmentStatus,
        row.commissionRate,
        row.uberDriverId,
        row.boltDriverId,
        row.glovoCourierId,
        row.boltCourierId,
        row.woltCourierId,
        row.licenseNumber,
        row.notes,
      ],
    );
    imported += 1;
  }

  return buildCsvImportSummary(stats, imported, invalidRowsSkipped, extraEmptyRowsSkipped);
}
