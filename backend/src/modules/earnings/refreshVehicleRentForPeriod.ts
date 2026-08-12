import type { PoolClient } from "pg";
import { applyWeekDebtCarryForward } from "./debtAllocation";
import { applyWeeklyCustomFeesToRawNet } from "./driverPayoutCustomFees";
import { syncDriverWeekVehicleRent } from "./payoutRentEntries";

/** Recompute vehicle_rental_fee once per driver/week, sync rent line items, and re-apply debt. */
export async function refreshVehicleRentForPeriod(
  client: PoolClient,
  orgId: string,
  periodStart: string,
  periodEnd: string,
): Promise<{ feesUpdated: number; payoutsSynced: number }> {
  const ps = periodStart.slice(0, 10);
  const pe = periodEnd.slice(0, 10);

  /** Align open payouts org-wide (anchor-only rent), then re-sync this period's entries. */
  const feeRes = await client.query<{ n: string }>(
    `SELECT refresh_driver_payout_vehicle_fees($1::uuid)::text AS n`,
    [orgId],
  );
  const feesUpdated = parseInt(feeRes.rows[0]?.n ?? "0", 10);

  const driversRes = await client.query<{ driver_id: string }>(
    `SELECT DISTINCT driver_id::text
     FROM driver_payouts
     WHERE organization_id = $1::uuid
       AND payment_period_start = $2::date
       AND payment_period_end = $3::date`,
    [orgId, ps, pe],
  );

  const driverIds = driversRes.rows.map((r) => r.driver_id);
  let payoutsSynced = 0;
  for (const driverId of driverIds) {
    const synced = await syncDriverWeekVehicleRent(client, orgId, driverId, ps, pe);
    payoutsSynced += synced.payoutsTouched;
  }

  if (driverIds.length) {
    await applyWeeklyCustomFeesToRawNet(client, orgId, ps, pe, driverIds);
  }

  for (const driverId of driverIds) {
    await applyWeekDebtCarryForward(client, orgId, driverId, ps, pe);
  }

  return { feesUpdated, payoutsSynced };
}
