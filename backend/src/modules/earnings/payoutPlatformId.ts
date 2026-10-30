import type { EarningsPlatform } from "./detectPlatform";
import type { DriverMatchRow } from "./matchDriver";

/**
 * Platform ID shown on payouts and the statement.
 * Prefers the driver's ID for that platform. The ID stored on the payout is
 * used only when the driver has none. Bolt Taxi UUIDs are left out.
 */
export const payoutPlatformIdSelectSql = `COALESCE(
  CASE dp.platform
    WHEN 'uber' THEN NULLIF(BTRIM(d.uber_driver_id), '')
    WHEN 'glovo' THEN NULLIF(BTRIM(d.glovo_courier_id), '')
    WHEN 'bolt' THEN COALESCE(NULLIF(BTRIM(d.bolt_courier_id), ''), NULLIF(BTRIM(d.bolt_driver_id), ''))
    ELSE NULL
  END,
  CASE
    WHEN NULLIF(BTRIM(dp.platform_id), '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN NULL
    ELSE NULLIF(BTRIM(dp.platform_id), '')
  END
) AS platform_id`;

export function payoutPlatformIdForDriver(drv: DriverMatchRow, platform: EarningsPlatform): string | null {
  switch (platform) {
    case "uber":
      return drv.uber_driver_id ?? null;
    case "bolt":
      return drv.bolt_driver_id ?? null;
    case "glovo":
      return drv.glovo_courier_id ?? null;
    case "bolt_courier":
      return drv.bolt_courier_id ?? null;
    case "bolt_taxi":
      return drv.bolt_taxi_driver_uuid ?? null;
    case "wolt_courier":
      return drv.wolt_courier_id ?? null;
    default:
      return null;
  }
}
