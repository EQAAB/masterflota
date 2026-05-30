/**
 * Recompute driver payouts after migration 085 (driver_weekly_fees).
 *
 * Run on production after deploying:
 *   085_driver_weekly_fees.sql
 *
 * Usage:
 *   cd backend
 *   npx ts-node --transpile-only scripts/repair-recurring-fee-duplicates.ts <orgId> [--dry-run]
 *
 * Re-syncs weekly recurring fees and recomputes debt for drivers with multi-platform
 * payouts in weeks that had recurring fee adjustments (or any open multi-platform week).
 */
import { pool } from "../src/db/pool";
import { recomputeDriverDebtAllocation } from "../src/modules/earnings/debtAllocation";
import { applyCustomFeesToRawNet } from "../src/modules/earnings/driverPayoutCustomFees";
import { syncRecurringFeesToDriverWeek } from "../src/modules/earnings/driverWeeklyFees";

async function countDuplicateRecurringAdjustments(client: Awaited<ReturnType<typeof pool.connect>>) {
  const { rows } = await client.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM (
       SELECT driver_id, payment_period_start, fee_name
       FROM driver_payout_adjustments pa
       JOIN driver_payouts dp ON pa.driver_payout_id = dp.id
       WHERE pa.source = 'recurring'
       GROUP BY driver_id, payment_period_start, fee_name
       HAVING COUNT(*) > 1
     ) dup`,
  );
  return Number(rows[0]?.count ?? "0");
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const orgId = args.find((a) => a !== "--dry-run");
  if (!orgId) {
    console.error("Usage: repair-recurring-fee-duplicates <orgId> [--dry-run]");
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    const beforeDupes = await countDuplicateRecurringAdjustments(client);
    console.log(JSON.stringify({ phase: "before", duplicate_recurring_groups: beforeDupes }, null, 2));

    const { rows: affected } = await client.query<{
      driver_id: string;
      payment_period_start: string;
      payment_period_end: string;
      platform_count: string;
    }>(
      `SELECT dp.driver_id::text,
              dp.payment_period_start::text,
              dp.payment_period_end::text,
              COUNT(DISTINCT dp.platform)::text AS platform_count
       FROM driver_payouts dp
       WHERE dp.organization_id = $1::uuid
         AND dp.payment_status NOT IN ('paid', 'approved')
       GROUP BY dp.driver_id, dp.payment_period_start, dp.payment_period_end
       HAVING COUNT(DISTINCT dp.platform) > 1
          OR EXISTS (
            SELECT 1 FROM driver_weekly_fees dwf
            WHERE dwf.driver_id = dp.driver_id
              AND dwf.organization_id = dp.organization_id
              AND dwf.payment_period_start = dp.payment_period_start
              AND dwf.payment_period_end = dp.payment_period_end
          )
       ORDER BY dp.payment_period_end DESC, dp.driver_id`,
      [orgId],
    );

    console.log(JSON.stringify({ affected_driver_weeks: affected.length, dryRun }, null, 2));

    if (dryRun) {
      console.log(JSON.stringify({ phase: "dry-run", would_recompute: affected.length }, null, 2));
      return;
    }

    await client.query("BEGIN");

    let recomputedDrivers = 0;
    const seenDrivers = new Set<string>();

    for (const row of affected) {
      const ps = row.payment_period_start.slice(0, 10);
      const pe = row.payment_period_end.slice(0, 10);

      await syncRecurringFeesToDriverWeek(client, orgId, row.driver_id, ps, pe);

      const payouts = await client.query<{ id: string }>(
        `SELECT id::text FROM driver_payouts
         WHERE organization_id = $1::uuid AND driver_id = $2::uuid
           AND payment_period_start = $3::date AND payment_period_end = $4::date
         ORDER BY id`,
        [orgId, row.driver_id, ps, pe],
      );

      for (const p of payouts.rows) {
        await applyCustomFeesToRawNet(client, orgId, p.id);
      }

      if (!seenDrivers.has(row.driver_id)) {
        await recomputeDriverDebtAllocation(client, orgId, row.driver_id);
        seenDrivers.add(row.driver_id);
        recomputedDrivers += 1;
      }
    }

    await client.query("COMMIT");

    const afterDupes = await countDuplicateRecurringAdjustments(client);
    console.log(
      JSON.stringify(
        {
          phase: "after",
          duplicate_recurring_groups: afterDupes,
          driver_weeks_processed: affected.length,
          drivers_debt_recomputed: recomputedDrivers,
        },
        null,
        2,
      ),
    );
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
