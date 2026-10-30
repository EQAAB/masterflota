import type { EarningsPlatform } from "./detectPlatform";
import type { DriverMatchRow } from "./matchDriver";

/**
 * Courier ID shown on payouts and the statement.
 * Uses the ID stored on the payout, then the driver's ID for that platform.
 * Bolt payouts cover Bolt courier imports, so both Bolt ID columns are checked.
 */
export const payoutPlatformIdSelectSql = `COALESCE(
  NULLIF(BTRIM(dp.platform_id), ''),
  CASE dp.platform
    WHEN 'uber' THEN NULLIF(BTRIM(d.uber_driver_id), '')
    WHEN 'glovo' THEN NULLIF(BTRIM(d.glovo_courier_id), '')
    WHEN 'bolt' THEN COALESCE(NULLIF(BTRIM(d.bolt_courier_id), ''), NULLIF(BTRIM(d.bolt_driver_id), ''))
    WHEN 'bolt_taxi' THEN NULLIF(BTRIM(d.bolt_taxi_driver_uuid::text), '')
    ELSE NULL
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
