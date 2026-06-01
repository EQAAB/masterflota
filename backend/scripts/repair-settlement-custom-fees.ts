/**
 * Recompute driver payout nets (custom fees + debt) and refresh subcontractor settlement links.
 *
 * Run after deploying settlement fee SQL fixes when historical settlements show
 * zero custom deductions or payable amounts that ignore manual/recurring fees.
 *
 * Usage:
 *   cd backend
 *   npx ts-node --transpile-only scripts/repair-settlement-custom-fees.ts <orgId> [weekStart weekEnd] [--dry-run]
 *   npx ts-node --transpile-only scripts/repair-settlement-custom-fees.ts <orgId> --all-weeks [--dry-run]
 *
 * Examples:
 *   npx ts-node --transpile-only scripts/repair-settlement-custom-fees.ts <orgId> 2026-04-14 2026-04-20
 *   npx ts-node --transpile-only scripts/repair-settlement-custom-fees.ts <orgId> --all-weeks
 */
import { pool } from "../src/db/pool";
import { applyWeeklyCustomFees } from "../src/modules/earnings/driverPayoutCustomFees";

async function discoverWeeks(
  client: Awaited<ReturnType<typeof pool.connect>>,
  orgId: string,
): Promise<{ start: string; end: string }[]> {
  const { rows } = await client.query<{ start: string; end: string }>(
    `SELECT DISTINCT dp.payment_period_start::text AS start, dp.payment_period_end::text AS end
     FROM driver_payouts dp
     INNER JOIN drivers d ON d.id = dp.driver_id AND d.organization_id = dp.organization_id
     WHERE dp.organization_id = $1::uuid
       AND d.subcontractor_id IS NOT NULL
       AND (
         EXISTS (
           SELECT 1 FROM driver_payout_adjustments pa
           WHERE pa.driver_payout_id = dp.id AND pa.source = 'manual'
         )
         OR EXISTS (
           SELECT 1 FROM driver_weekly_fees dwf
           WHERE dwf.organization_id = dp.organization_id
             AND dwf.driver_id = dp.driver_id
             AND dwf.payment_period_start = dp.payment_period_start
             AND dwf.payment_period_end = dp.payment_period_end
         )
       )
     ORDER BY start DESC, end DESC`,
    [orgId],
  );
  return rows;
}

async function repairWeek(
  client: Awaited<ReturnType<typeof pool.connect>>,
  orgId: string,
  weekStart: string,
  weekEnd: string,
  dryRun: boolean,
): Promise<{ driversProcessed: number; payoutRowsUpdated: number; settlementsRefreshed: number }> {
  if (dryRun) {
    const { rows } = await client.query<{ drivers: string; payouts: string }>(
      `SELECT COUNT(DISTINCT dp.driver_id)::text AS drivers,
              COUNT(DISTINCT dp.id)::text AS payouts
       FROM driver_payouts dp
       INNER JOIN drivers d ON d.id = dp.driver_id AND d.organization_id = dp.organization_id
       WHERE dp.organization_id = $1::uuid
         AND dp.payment_period_start = $2::date
         AND dp.payment_period_end = $3::date
         AND d.subcontractor_id IS NOT NULL`,
      [orgId, weekStart, weekEnd],
    );
    return {
      driversProcessed: Number(rows[0]?.drivers ?? "0"),
      payoutRowsUpdated: Number(rows[0]?.payouts ?? "0"),
      settlementsRefreshed: 0,
    };
  }

  await client.query("BEGIN");
  try {
    const feeResult = await applyWeeklyCustomFees(client, orgId, weekStart, weekEnd);
    const refreshRes = await client.query<{ n: string }>(
      `SELECT refresh_subcontractor_payouts($1::uuid, $2::date, $3::date)::text AS n`,
      [orgId, weekStart, weekEnd],
    );
    await client.query("COMMIT");
    return {
      driversProcessed: feeResult.driversProcessed,
      payoutRowsUpdated: feeResult.payoutRowsUpdated,
      settlementsRefreshed: parseInt(refreshRes.rows[0]?.n ?? "0", 10),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--dry-run");
  const dryRun = process.argv.includes("--dry-run");
  const allWeeks = args.includes("--all-weeks");
  const orgId = args.find((a) => a !== "--all-weeks");
  const weekStart = allWeeks ? undefined : args[1];
  const weekEnd = allWeeks ? undefined : args[2];

  if (!orgId) {
    console.error(
      "Usage: repair-settlement-custom-fees <orgId> [weekStart weekEnd] [--dry-run]\n" +
        "       repair-settlement-custom-fees <orgId> --all-weeks [--dry-run]",
    );
    process.exit(1);
  }

  if (!allWeeks && (!weekStart || !weekEnd)) {
    console.error("Provide weekStart and weekEnd, or use --all-weeks");
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    const weeks = allWeeks
      ? await discoverWeeks(client, orgId)
      : [{ start: weekStart!, end: weekEnd! }];

    console.log(
      JSON.stringify(
        { orgId, dryRun, weekCount: weeks.length, weeks: weeks.slice(0, 20) },
        null,
        2,
      ),
    );

    let totalDrivers = 0;
    let totalPayouts = 0;
    let totalSettlements = 0;

    for (const w of weeks) {
      const result = await repairWeek(client, orgId, w.start, w.end, dryRun);
      totalDrivers += result.driversProcessed;
      totalPayouts += result.payoutRowsUpdated;
      totalSettlements += result.settlementsRefreshed;
      console.log(
        JSON.stringify({ week: w, ...result, dryRun }, null, 2),
      );
    }

    console.log(
      JSON.stringify(
        {
          done: true,
          dryRun,
          weeksProcessed: weeks.length,
          totalDriversProcessed: totalDrivers,
          totalPayoutRowsUpdated: totalPayouts,
          totalSettlementsRefreshed: totalSettlements,
        },
        null,
        2,
      ),
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
