import type { Pool, PoolClient } from "pg";

export class DeleteEarningsImportError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "HAS_PROCESSED_ROWS" | "HAS_EARNINGS_RECORDS",
  ) {
    super(message);
    this.name = "DeleteEarningsImportError";
  }
}

type ImportRow = {
  id: string;
  processed_rows: number;
  record_count: number | null;
};

async function loadImport(
  db: Pool | PoolClient,
  orgId: string,
  importId: string,
): Promise<ImportRow | null> {
  const res = await db.query<ImportRow>(
    `SELECT id::text,
            COALESCE(processed_rows, record_count, 0)::int AS processed_rows,
            record_count
     FROM earnings_imports
     WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [importId, orgId],
  );
  return res.rows[0] ?? null;
}

/** Hard-delete import when no earnings rows were committed (processed_rows = 0). */
export async function deleteEarningsImportIfEmpty(
  db: Pool | PoolClient,
  orgId: string,
  importId: string,
): Promise<void> {
  const imp = await loadImport(db, orgId, importId);
  if (!imp) {
    throw new DeleteEarningsImportError("Import not found", "NOT_FOUND");
  }

  const processed = imp.processed_rows ?? imp.record_count ?? 0;
  if (processed > 0) {
    throw new DeleteEarningsImportError(
      "Cannot delete import with processed rows. Use Revert instead.",
      "HAS_PROCESSED_ROWS",
    );
  }

  const erRes = await db.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM earnings_records WHERE import_id = $1::uuid`,
    [importId],
  );
  if (parseInt(erRes.rows[0]?.c ?? "0", 10) > 0) {
    throw new DeleteEarningsImportError(
      "Cannot delete import with financial records. Use Revert instead.",
      "HAS_EARNINGS_RECORDS",
    );
  }

  const del = await db.query(
    `DELETE FROM earnings_imports WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [importId, orgId],
  );
  if ((del.rowCount ?? 0) === 0) {
    throw new DeleteEarningsImportError("Import not found", "NOT_FOUND");
  }
}
