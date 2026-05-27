import { describe, expect, it, vi } from "vitest";
import type { PoolClient } from "pg";
import { revertEarningsImport, RevertEarningsImportError } from "./revertEarningsImport";

vi.mock("./recomputeDriverPayoutRollup", () => ({
  recomputeDriverPayoutRollup: vi.fn().mockResolvedValue("payout-id"),
}));

const importId = "11111111-1111-4111-8111-111111111111";
const orgId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const driverId = "44444444-4444-4444-8444-444444444444";
const recordId = "55555555-5555-4555-8555-555555555555";

const completedImport = {
  id: importId,
  status: "completed",
  platform: "glovo",
  week_start: "2026-05-11",
  week_end: "2026-05-17",
};

const originalRecord = {
  id: recordId,
  driver_id: driverId,
  platform: "glovo",
  trip_date: "2026-05-12",
  trip_count: 1,
  gross_earnings: "100.00",
  platform_fee: "10.00",
  net_earnings: "80.00",
  total_transfer_earnings: null,
  daily_cash: "5.00",
  account_opening_fee: "0",
  company_commission: "20.00",
  commission_base: "80.00",
  tips: "10.00",
  driver_payout: "55.00",
  commission_type: "percentage",
};

function mockClient(handlers: {
  import?: typeof completedImport | null;
  originals?: typeof originalRecord[];
  paidDrivers?: number;
  paidSubs?: number;
}): PoolClient {
  const queries: { text: string; values?: unknown[] }[] = [];
  const client = {
    query: vi.fn(async (text: string, values?: unknown[]) => {
      queries.push({ text, values });
      const t = text.replace(/\s+/g, " ").trim();

      if (t.includes("FROM earnings_imports") && t.includes("FOR UPDATE")) {
        return { rows: handlers.import ? [handlers.import] : [] };
      }
      if (
        t.includes("SELECT") &&
        t.includes("FROM earnings_records") &&
        t.includes("COALESCE(is_reversal")
      ) {
        return { rows: handlers.originals ?? [] };
      }
      if (t.includes("driver_payouts") && t.includes("payment_status = 'paid'") && t.includes("subcontractor_payouts")) {
        return { rows: [{ c: String(handlers.paidSubs ?? 0) }] };
      }
      if (t.includes("driver_payouts") && t.includes("payment_status = 'paid'")) {
        return { rows: [{ c: String(handlers.paidDrivers ?? 0) }] };
      }
      if (t.startsWith("INSERT INTO earnings_records")) {
        return { rowCount: handlers.originals?.length ?? 0 };
      }
      if (t.includes("UPDATE earnings_imports") && t.includes("reverted")) {
        return { rowCount: 1 };
      }
      if (t.includes("FROM drivers d")) {
        return {
          rows: [
            {
              id: driverId,
              phone: null,
              first_name: "Test",
              last_name: "Driver",
              uber_driver_id: null,
              bolt_driver_id: null,
              glovo_courier_id: "g1",
              bolt_courier_id: null,
              bolt_taxi_driver_uuid: null,
              wolt_courier_id: null,
              commission_type: "percentage",
              commission_rate: "0.25",
              fixed_commission_amount: null,
              minimum_commission: null,
            },
          ],
        };
      }
      if (t.includes("refresh_subcontractor_payouts")) {
        return { rows: [] };
      }
      return { rows: [] };
    }),
  } as unknown as PoolClient;
  return client;
}

describe("revertEarningsImport", () => {
  it("inserts reversal rows and marks import reverted", async () => {
    const client = mockClient({ import: completedImport, originals: [originalRecord] });
    const result = await revertEarningsImport(client, orgId, importId, userId);
    expect(result.reversalRowCount).toBe(1);
    expect(result.driversRecalculated).toBe(1);
    expect(result.importId).toBe(importId);

    const insertCall = vi.mocked(client.query).mock.calls.find((c) =>
      String(c[0]).includes("INSERT INTO earnings_records"),
    );
    expect(insertCall).toBeDefined();
    const values = insertCall![1] as unknown[];
    expect(values).toContain(-100);
    expect(String(insertCall![0])).toContain("is_reversal");
    expect(values).toContain(recordId);
  });

  it("blocks when driver payout is paid", async () => {
    const client = mockClient({
      import: completedImport,
      originals: [originalRecord],
      paidDrivers: 1,
    });
    await expect(revertEarningsImport(client, orgId, importId, userId)).rejects.toMatchObject({
      code: "DRIVER_PAID",
    });
  });

  it("blocks when subcontractor settlement is paid", async () => {
    const client = mockClient({
      import: completedImport,
      originals: [originalRecord],
      paidSubs: 1,
    });
    await expect(revertEarningsImport(client, orgId, importId, userId)).rejects.toMatchObject({
      code: "SUBCONTRACTOR_PAID",
    });
  });

  it("rejects already reverted import", async () => {
    const client = mockClient({
      import: { ...completedImport, status: "reverted" },
      originals: [originalRecord],
    });
    await expect(revertEarningsImport(client, orgId, importId, userId)).rejects.toMatchObject({
      code: "ALREADY_REVERTED",
    });
  });

  it("rejects preview import", async () => {
    const client = mockClient({
      import: { ...completedImport, status: "preview" },
      originals: [originalRecord],
    });
    await expect(revertEarningsImport(client, orgId, importId, userId)).rejects.toMatchObject({
      code: "INVALID_STATUS",
    });
  });

  it("throws NOT_FOUND when import missing", async () => {
    const client = mockClient({ import: null });
    await expect(revertEarningsImport(client, orgId, importId, userId)).rejects.toBeInstanceOf(
      RevertEarningsImportError,
    );
  });
});
