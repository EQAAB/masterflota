import type { EarningsPlatform } from "./detectPlatform";
import type { DriverMatchRow } from "./matchDriver";

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
    case "wolt_courier":
      return drv.wolt_courier_id ?? null;
    default:
      return null;
  }
}
