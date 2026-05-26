import { describe, expect, it, vi } from "vitest";
import { deleteEarningsImportIfEmpty, DeleteEarningsImportError } from "./deleteEarningsImport";

const orgId = "22222222-2222-4222-8222-222222222222";
const importId = "11111111-1111-4111-8111-111111111111";

function mockPool(opts: {
  import?: { processed_rows: number; record_count?: number | null } | null;
  earningsRecordCount?: number;
  deleted?: boolean;
}) {
  return {
    query: vi.fn(async (text: string) => {
      const t = text.replace(/\s+/g, " ").trim();
      if (t.includes("FROM earnings_imports") && t.includes("SELECT")) {
        return {
          rows: opts.import
            ? [{ id: importId, processed_rows: opts.import.processed_rows, record_count: opts.import.record_count ?? null }]
            : [],
        };
      }
      if (t.includes("FROM earnings_records")) {
        return { rows: [{ c: String(opts.earningsRecordCount ?? 0) }] };
      }
      if (t.startsWith("DELETE FROM earnings_imports")) {
        return { rowCount: opts.deleted === false ? 0 : 1 };
      }
      return { rows: [] };
    }),
  };
}

describe("deleteEarningsImportIfEmpty", () => {
  it("deletes when processed_rows is 0", async () => {
    const pool = mockPool({ import: { processed_rows: 0 }, earningsRecordCount: 0 });
    await expect(deleteEarningsImportIfEmpty(pool as never, orgId, importId)).resolves.toBeUndefined();
  });

  it("blocks when processed_rows > 0", async () => {
    const pool = mockPool({ import: { processed_rows: 5, record_count: 5 } });
    await expect(deleteEarningsImportIfEmpty(pool as never, orgId, importId)).rejects.toMatchObject({
      code: "HAS_PROCESSED_ROWS",
    });
  });

  it("blocks when earnings_records exist", async () => {
    const pool = mockPool({ import: { processed_rows: 0 }, earningsRecordCount: 1 });
    await expect(deleteEarningsImportIfEmpty(pool as never, orgId, importId)).rejects.toMatchObject({
      code: "HAS_EARNINGS_RECORDS",
    });
  });
});
