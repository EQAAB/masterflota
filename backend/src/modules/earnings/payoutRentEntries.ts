import type { PoolClient } from "pg";
import { insertVehicleHistory } from "../vehicles/vehicleHistory";
import { pickWeeklyFeeAnchorPlatform } from "./driverWeeklyFees";
import { isFrozenPayoutStatus, OPEN_PAYOUT_STATUS_SQL } from "./payoutFreeze";

/**
 * Whether this platform should carry vehicle rent for the driver week.
 * Same priority as weekly recurring fees: Glovo → Uber → Bolt Taxi → Bolt.
 */
export function shouldChargeVehicleRentOnPlatform(
  platform: string,
  platformsInWeek: string[],
): boolean {
  if (!platformsInWeek.length) return false;
  return pickWeeklyFeeAnchorPlatform(platformsInWeek) === platform;
}

/**
 * Clear weekly/overdue rent line items on a non-anchor payout; keep manual adjustments.
 * Recalculates vehicle_rental_fee and baseline raw_net (before custom/recurring fees).
 */
export async function clearPayoutVehicleRent(
  client: PoolClient,
  orgId: string,
  payoutId: string,
): Promise<void> {
  const lockRes = await client.query<{ payment_status: string }>(
    `SELECT payment_status
     FROM driver_payouts
     WHERE id = $1::uuid AND organization_id = $2::uuid
     FOR UPDATE`,
    [payoutId, orgId],
  );
  const row = lockRes.rows[0];
  if (!row || isFrozenPayoutStatus(row.payment_status)) return;

  await client.query(
    `DELETE FROM payout_rent_entries
     WHERE driver_payout_id = $1::uuid
       AND entry_type IN ('current_week', 'overdue')`,
    [payoutId],
  );

  await client.query(
    `UPDATE driver_payouts dp
     SET
       vehicle_rental_fee = COALESCE(agg.sum_amt, 0),
       raw_net_amount = ROUND((
         COALESCE(dp.total_net_earnings, 0)::numeric
         - COALESCE(dp.company_commission, 0)::numeric
         - ABS(COALESCE(dp.total_daily_cash, 0)::numeric)
         - ABS(COALESCE(dp.account_opening_fee, 0)::numeric)
         - COALESCE(agg.sum_amt, 0)::numeric
       )::numeric, 2),
       updated_at = NOW()
     FROM (
       SELECT ROUND(COALESCE(SUM(amount), 0)::numeric, 2) AS sum_amt
       FROM payout_rent_entries
       WHERE driver_payout_id = $1::uuid
         AND entry_type IN ('current_week', 'overdue', 'adjustment')
     ) agg
     WHERE dp.id = $1::uuid AND dp.organization_id = $2::uuid`,
    [payoutId, orgId],
  );
}

/**
 * Rebuilds payroll vehicle rent line item from driver vehicle assignment (weekly_rent),
 * updates vehicle_rental_fee and raw_net_amount from entry totals (includes adjustment rows).
 */
export async function syncPayoutRentEntries(client: PoolClient, orgId: string, payoutId: string): Promise<void> {
  const lockRes = await client.query<{ driver_id: string; payment_status: string }>(
    `SELECT driver_id::text, payment_status
     FROM driver_payouts
     WHERE id = $1::uuid AND organization_id = $2::uuid
     FOR UPDATE`,
    [payoutId, orgId],
  );
  const locked = lockRes.rows[0];
  if (!locked || isFrozenPayoutStatus(locked.payment_status)) return;

  await client.query(
    `DELETE FROM payout_rent_entries
     WHERE driver_payout_id = $1::uuid
       AND entry_type IN ('current_week', 'overdue')`,
    [payoutId],
  );

  await client.query(
    `INSERT INTO payout_rent_entries (driver_payout_id, entry_type, amount, description)
     SELECT $1::uuid,
            'current_week',
            calculate_rental_fee(dp.organization_id, dp.driver_id, dp.payment_period_start, dp.payment_period_end),
            (
              'Weekly vehicle rent'
              || COALESCE(' (' || v.license_plate || ')', '')
              || ' for period '
              || dp.payment_period_start::text
              || '–'
              || dp.payment_period_end::text
            )
     FROM driver_payouts dp
     LEFT JOIN drivers d ON d.id = dp.driver_id AND d.organization_id = dp.organization_id
     LEFT JOIN vehicles v ON v.id = d.current_vehicle_id AND v.organization_id = d.organization_id
     WHERE dp.id = $1::uuid
       AND calculate_rental_fee(dp.organization_id, dp.driver_id, dp.payment_period_start, dp.payment_period_end) > 0`,
    [payoutId],
  );

  const rentLogRes = await client.query<{
    vehicle_id: string;
    driver_id: string;
    license_plate: string | null;
    rent_amount: string;
    period_start: string;
    period_end: string;
  }>(
    `SELECT v.id::text AS vehicle_id,
            dp.driver_id::text AS driver_id,
            v.license_plate,
            calculate_rental_fee(dp.organization_id, dp.driver_id, dp.payment_period_start, dp.payment_period_end)::text AS rent_amount,
            dp.payment_period_start::text AS period_start,
            dp.payment_period_end::text AS period_end
       FROM driver_payouts dp
       INNER JOIN drivers d ON d.id = dp.driver_id AND d.organization_id = dp.organization_id
       INNER JOIN vehicles v ON v.id = d.current_vehicle_id AND v.organization_id = dp.organization_id
      WHERE dp.id = $1::uuid
        AND calculate_rental_fee(dp.organization_id, dp.driver_id, dp.payment_period_start, dp.payment_period_end) > 0`,
    [payoutId],
  );

  for (const row of rentLogRes.rows) {
    const dup = await client.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM vehicle_history
       WHERE event_type = 'rent_collected'
         AND vehicle_id = $1::uuid
         AND metadata->>'driver_payout_id' = $2`,
      [row.vehicle_id, payoutId],
    );
    if (parseInt(dup.rows[0]?.c ?? "0", 10) > 0) continue;

    const amount = Number(row.rent_amount) || 0;
    await insertVehicleHistory(client, {
      orgId,
      vehicleId: row.vehicle_id,
      eventType: "rent_collected",
      driverId: row.driver_id,
      cost: amount,
      title: "Rent collected",
      description: `Weekly rent ${amount.toFixed(2)} deducted for ${row.period_start}–${row.period_end}`,
      metadata: {
        driver_payout_id: payoutId,
        period_start: row.period_start,
        period_end: row.period_end,
        license_plate: row.license_plate,
      },
    });
  }

  await client.query(
    `UPDATE driver_payouts dp
     SET
       vehicle_rental_fee = COALESCE(agg.sum_amt, 0),
       raw_net_amount = ROUND((
         COALESCE(dp.total_net_earnings, 0)::numeric
         - COALESCE(dp.company_commission, 0)::numeric
         - ABS(COALESCE(dp.total_daily_cash, 0)::numeric)
         - ABS(COALESCE(dp.account_opening_fee, 0)::numeric)
         - COALESCE(agg.sum_amt, 0)::numeric
       )::numeric, 2),
       updated_at = NOW()
     FROM (
       SELECT ROUND(COALESCE(SUM(amount), 0)::numeric, 2) AS sum_amt
       FROM payout_rent_entries
       WHERE driver_payout_id = $1::uuid
         AND entry_type IN ('current_week', 'overdue', 'adjustment')
     ) agg
     WHERE dp.id = $1::uuid`,
    [payoutId],
  );
}

/**
 * Charge weekly vehicle rent once per driver/week on the fee-anchor platform only
 * (Glovo → Uber → Bolt Taxi → Bolt). Clears rent from sibling platform legs.
 */
export async function syncDriverWeekVehicleRent(
  client: PoolClient,
  orgId: string,
  driverId: string,
  periodStart: string,
  periodEnd: string,
): Promise<{ anchorPayoutId: string | null; payoutsTouched: number }> {
  const ps = periodStart.slice(0, 10);
  const pe = periodEnd.slice(0, 10);

  const { rows } = await client.query<{ id: string; platform: string }>(
    `SELECT id::text, platform
     FROM driver_payouts
     WHERE organization_id = $1::uuid
       AND driver_id = $2::uuid
       AND payment_period_start = $3::date
       AND payment_period_end = $4::date
       AND ${OPEN_PAYOUT_STATUS_SQL}
     ORDER BY id`,
    [orgId, driverId, ps, pe],
  );
  if (!rows.length) return { anchorPayoutId: null, payoutsTouched: 0 };

  const anchorPlatform = pickWeeklyFeeAnchorPlatform(rows.map((r) => r.platform));
  const anchorPayoutId =
    rows.find((r) => r.platform === anchorPlatform)?.id ?? rows[0]?.id ?? null;
  let payoutsTouched = 0;

  for (const { id } of rows) {
    if (anchorPayoutId && id === anchorPayoutId) {
      await syncPayoutRentEntries(client, orgId, id);
    } else {
      await clearPayoutVehicleRent(client, orgId, id);
    }
    payoutsTouched += 1;
  }

  return { anchorPayoutId, payoutsTouched };
}
