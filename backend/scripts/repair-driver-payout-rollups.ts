/**
 * Rebuild driver_payouts for drivers with earnings_records in a payment week.
 *
 * Apply on the target DB first:
 *   079_driver_payouts_platform_uber.sql
 *   080_uber_preserve_net_earnings_trigger.sql
 *   081_fix_uber_corrupted_net_earnings.sql
 *
 * Then run (uses each driver's commission_rate from DB):
 *   cd backend
 *   npx ts-node --transpile-only scripts/repair-driver-payout-rollups.ts <orgId> uber <weekStart> <weekEnd>
 *
 * Example:
 *   npx ts-node --transpile-only scripts/repair-driver-payout-rollups.ts <orgId> uber 2026-04-14 2026-04-20
 */
import { pool } from "../src/db/pool";
import { recomputeDriverPayoutsForPaymentWeek } from "../src/modules/earnings/recomputeDriverPayoutRollup";
import { isEarningsPlatform, type EarningsPlatform } from "../src/modules/earnings/detectPlatform";
import type { DriverMatchRow } from "../src/modules/earnings/matchDriver";

async function main() {
  const [orgId, platformRaw, weekStart, weekEnd] = process.argv.slice(2);
  if (!orgId || !platformRaw || !weekStart || !weekEnd) {
    console.error(
      "Usage: repair-driver-payout-rollups <orgId> <platform> <weekStart YYYY-MM-DD> <weekEnd YYYY-MM-DD>",
    );
    process.exit(1);
  }
  if (!isEarningsPlatform(platformRaw)) {
    console.error("Invalid platform:", platformRaw);
    process.exit(1);
  }
  const platform = platformRaw as EarningsPlatform;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const driversRes = await client.query<DriverMatchRow & { id: string }>(
      `SELECT d.id, d.phone, d.uber_driver_id, d.bolt_driver_id, d.glovo_courier_id, d.bolt_courier_id, d.wolt_courier_id,
              d.commission_type, d.commission_rate::text, d.fixed_commission_amount::text, d.minimum_commission::text
       FROM drivers d WHERE d.organization_id = $1::uuid`,
      [orgId],
    );
    const driverById = new Map(driversRes.rows.map((d) => [d.id, d]));
    const count = await recomputeDriverPayoutsForPaymentWeek(
      client,
      orgId,
      driverById,
      weekStart,
      weekEnd,
      platform,
    );
    await client.query("COMMIT");
    console.log(JSON.stringify({ orgId, platform, weekStart, weekEnd, payoutRowsUpserted: count }, null, 2));
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
