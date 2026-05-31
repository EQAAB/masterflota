import type { PoolClient } from "pg";
import type { EarningsPlatform } from "./detectPlatform";
import { isEarningsPlatform } from "./detectPlatform";
import type { DriverMatchRow } from "./matchDriver";
import { payoutPlatformFromEarnings } from "./payoutPlatform";
import { applyWeeklyCustomFees } from "./driverPayoutCustomFees";
import { recomputeDriverPayoutRollup } from "./recomputeDriverPayoutRollup";

export class RevertEarningsImportError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "INVALID_STATUS" | "ALREADY_REVERTED" | "NO_RECORDS" | "DRIVER_PAID" | "SUBCONTRACTOR_PAID",
  ) {
    super(message);
    this.name = "RevertEarningsImportError";
  }
}

export type RevertEarningsImportResult = {
  importId: string;
  reversalRowCount: number;
  driversRecalculated: number;
};

type EarningsRecordRow = {
  id: string;
  driver_id: string;
  platform: string;
  trip_date: string;
  trip_count: number | null;
  gross_earnings: string | null;
  platform_fee: string | null;
  net_earnings: string | null;
  total_transfer_earnings: string | null;
  daily_cash: string | null;
  account_opening_fee: string | null;
  company_commission: string | null;
  commission_base: string | null;
  tips: string | null;
  driver_payout: string | null;
  commission_type: string | null;
};

function negateNullable(n: string | null): number | null {
  if (n == null || n === "") return null;
  const v = Number(n);
  return Number.isFinite(v) ? -v : null;
}

function negateRequired(n: string | null): number {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? -v : 0;
}

/** Soft-revert a completed import: mirror negative earnings_records, mark import reverted, recompute rollups. */
export async function revertEarningsImport(
  client: PoolClient,
  orgId: string,
  importId: string,
  userId: string,
): Promise<RevertEarningsImportResult> {
  const impRes = await client.query<{
    id: string;
    status: string;
    platform: string;
    week_start: string;
    week_end: string;
  }>(
    `SELECT id::text, status, platform, week_start::text, week_end::text
     FROM earnings_imports
     WHERE id = $1::uuid AND organization_id = $2::uuid
     FOR UPDATE`,
    [importId, orgId],
  );
  const imp = impRes.rows[0];
  if (!imp) {
    throw new RevertEarningsImportError("Import not found", "NOT_FOUND");
  }
  if (imp.status === "reverted") {
    throw new RevertEarningsImportError("Import has already been reverted", "ALREADY_REVERTED");
  }
  if (imp.status !== "completed") {
    throw new RevertEarningsImportError(
      `Only completed imports can be reverted (current status: ${imp.status})`,
      "INVALID_STATUS",
    );
  }
  if (!isEarningsPlatform(imp.platform)) {
    throw new RevertEarningsImportError(`Unsupported import platform: ${imp.platform}`, "INVALID_STATUS");
  }
  const earningsPlatform: EarningsPlatform = imp.platform;
  const payoutPlatform = payoutPlatformFromEarnings(earningsPlatform);

  const originalsRes = await client.query<EarningsRecordRow>(
    `SELECT id::text, driver_id::text, platform, trip_date::text, trip_count,
            gross_earnings::text, platform_fee::text, net_earnings::text,
            total_transfer_earnings::text, daily_cash::text, account_opening_fee::text,
            company_commission::text, commission_base::text, tips::text, driver_payout::text,
            commission_type
     FROM earnings_records
     WHERE import_id = $1::uuid AND COALESCE(is_reversal, false) = false`,
    [importId],
  );
  const originals = originalsRes.rows;
  if (originals.length === 0) {
    const reversalOnly = await client.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM earnings_records WHERE import_id = $1::uuid AND is_reversal = true`,
      [importId],
    );
    if (parseInt(reversalOnly.rows[0]?.c ?? "0", 10) > 0) {
      throw new RevertEarningsImportError("Import has already been reverted", "ALREADY_REVERTED");
    }
    throw new RevertEarningsImportError("No earnings records found for this import", "NO_RECORDS");
  }

  const paidDriverRes = await client.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c
     FROM earnings_records er
     INNER JOIN driver_payouts dp ON dp.driver_id = er.driver_id
       AND dp.organization_id = $2::uuid
       AND dp.payment_period_start = $3::date
       AND dp.payment_period_end = $4::date
       AND dp.platform = $5
     WHERE er.import_id = $1::uuid
       AND COALESCE(er.is_reversal, false) = false
       AND dp.payment_status = 'paid'`,
    [importId, orgId, imp.week_start, imp.week_end, payoutPlatform],
  );
  if (parseInt(paidDriverRes.rows[0]?.c ?? "0", 10) > 0) {
    throw new RevertEarningsImportError(
      "Cannot revert. Driver already paid. Use manual adjustment.",
      "DRIVER_PAID",
    );
  }

  const paidSubRes = await client.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c
     FROM earnings_records er
     INNER JOIN driver_payouts dp ON dp.driver_id = er.driver_id
       AND dp.organization_id = $2::uuid
       AND dp.payment_period_start = $3::date
       AND dp.payment_period_end = $4::date
     INNER JOIN subcontractor_payouts sp ON sp.id = dp.subcontractor_payout_id
     WHERE er.import_id = $1::uuid
       AND COALESCE(er.is_reversal, false) = false
       AND sp.payment_status = 'paid'`,
    [importId, orgId, imp.week_start, imp.week_end],
  );
  if (parseInt(paidSubRes.rows[0]?.c ?? "0", 10) > 0) {
    throw new RevertEarningsImportError(
      "Cannot revert. Subcontractor already paid.",
      "SUBCONTRACTOR_PAID",
    );
  }

  const batch = 200;
  let reversalRowCount = 0;
  for (let i = 0; i < originals.length; i += batch) {
    const slice = originals.slice(i, i + batch);
    const values: unknown[] = [];
    const ph: string[] = [];
    let p = 1;
    for (const r of slice) {
      ph.push(
        `($${p++}::uuid, $${p++}::uuid, $${p++}, $${p++}::date, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, true, $${p++}::uuid)`,
      );
      values.push(
        importId,
        r.driver_id,
        r.platform,
        r.trip_date,
        r.trip_count,
        negateNullable(r.gross_earnings),
        negateNullable(r.platform_fee),
        negateNullable(r.net_earnings),
        negateNullable(r.total_transfer_earnings),
        negateNullable(r.daily_cash),
        negateNullable(r.account_opening_fee),
        negateNullable(r.company_commission),
        negateNullable(r.commission_base),
        negateNullable(r.tips),
        negateRequired(r.driver_payout),
        r.commission_type,
        r.id,
      );
    }
    await client.query(
      `INSERT INTO earnings_records (
          import_id, driver_id, platform, trip_date, trip_count,
          gross_earnings, platform_fee, net_earnings,
          total_transfer_earnings, daily_cash, account_opening_fee,
          company_commission, commission_base, tips, driver_payout, commission_type,
          is_reversal, reversal_of_record_id
        ) VALUES ${ph.join(",")}`,
      values,
    );
    reversalRowCount += slice.length;
  }

  await client.query(
    `UPDATE earnings_imports
     SET status = 'reverted', reverted_by = $2::uuid, reverted_at = NOW()
     WHERE id = $1::uuid`,
    [importId, userId],
  );

  const driverIds = [...new Set(originals.map((r) => r.driver_id))];
  const driversRes = await client.query<DriverMatchRow & { id: string }>(
    `SELECT d.id, d.phone, d.first_name, d.last_name, d.uber_driver_id, d.bolt_driver_id, d.glovo_courier_id,
            d.bolt_courier_id, d.bolt_taxi_driver_uuid::text AS bolt_taxi_driver_uuid, d.wolt_courier_id,
            d.commission_type, d.commission_rate::text, d.fixed_commission_amount::text, d.minimum_commission::text
     FROM drivers d
     WHERE d.organization_id = $1::uuid AND d.id = ANY($2::uuid[])`,
    [orgId, driverIds],
  );
  const driverById = new Map(driversRes.rows.map((d) => [d.id, d]));

  let driversRecalculated = 0;
  for (const driverId of driverIds) {
    const drv = driverById.get(driverId);
    if (!drv) continue;
    await recomputeDriverPayoutRollup(
      client,
      orgId,
      { ...drv, id: driverId },
      imp.week_start,
      imp.week_end,
      earningsPlatform,
    );
    driversRecalculated += 1;
  }

  await applyWeeklyCustomFees(client, orgId, imp.week_start, imp.week_end);

  await client.query(`SELECT refresh_subcontractor_payouts($1::uuid, $2::date, $3::date)`, [
    orgId,
    imp.week_start,
    imp.week_end,
  ]);

  return { importId, reversalRowCount, driversRecalculated };
}
