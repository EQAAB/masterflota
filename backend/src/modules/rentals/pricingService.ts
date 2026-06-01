import type { QueryResultRow } from "pg";
import type { PricingSnapshot, RentalType } from "./rentalTypes";

type Db = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: T[] }>;
};

export function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export async function resolvePricing(
  db: Db,
  orgId: string,
  vehicleId: string,
  rentalType: RentalType,
  startAt: Date,
  endAt: Date,
): Promise<{ snapshot: PricingSnapshot; subtotal: number; deposit: number; total: number }> {
  const { rows: vehicleRows } = await db.query<{
    vehicle_type: string;
    daily_rent: string;
    weekly_rent: string;
    monthly_rent: string;
  }>(
    `SELECT vehicle_type, daily_rent, weekly_rent, monthly_rent
     FROM vehicles WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [vehicleId, orgId],
  );
  const v = vehicleRows[0];
  if (!v) throw new Error("Vehicle not found");

  const { rows: priceRows } = await db.query<{
    daily_rate: string;
    weekly_rate: string;
    monthly_rate: string;
    deposit_default: string;
  }>(
    `SELECT daily_rate, weekly_rate, monthly_rate, deposit_default
     FROM rental_pricing
     WHERE organization_id = $1::uuid AND is_active = true
       AND (vehicle_id = $2::uuid OR vehicle_id IS NULL)
     ORDER BY vehicle_id NULLS LAST
     LIMIT 1`,
    [orgId, vehicleId],
  );

  const p = priceRows[0];
  const daily = Number(p?.daily_rate ?? v.daily_rent ?? 0);
  const weekly = Number(p?.weekly_rate ?? v.weekly_rent ?? 0);
  const monthly = Number(p?.monthly_rate ?? v.monthly_rent ?? 0);
  const deposit = Number(p?.deposit_default ?? 0);
  const days = daysBetween(startAt, endAt);

  let subtotal = 0;
  if (rentalType === "daily") subtotal = daily * days;
  else if (rentalType === "weekly") subtotal = weekly * Math.max(1, Math.ceil(days / 7));
  else subtotal = monthly * Math.max(1, Math.ceil(days / 30));

  subtotal = Math.round(subtotal * 100) / 100;

  const snapshot: PricingSnapshot = {
    daily_rate: daily,
    weekly_rate: weekly,
    monthly_rate: monthly,
    deposit_default: deposit,
    rental_type: rentalType,
    days,
  };

  return {
    snapshot,
    subtotal,
    deposit,
    total: subtotal,
  };
}
