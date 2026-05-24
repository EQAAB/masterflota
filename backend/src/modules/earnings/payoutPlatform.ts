import type { EarningsPlatform } from "./detectPlatform";

/** Stored on driver_payouts.platform (Bolt imports use earnings platform bolt_courier). */
export type DriverPayoutPlatform = "glovo" | "bolt";

const DRIVER_PAYOUT_PLATFORMS: DriverPayoutPlatform[] = ["glovo", "bolt"];

export function isDriverPayoutPlatform(s: string): s is DriverPayoutPlatform {
  return DRIVER_PAYOUT_PLATFORMS.includes(s as DriverPayoutPlatform);
}

/** Map earnings_records / import platform to driver_payouts.platform. */
export function payoutPlatformFromEarnings(platform: EarningsPlatform): DriverPayoutPlatform {
  if (platform === "bolt_courier") return "bolt";
  if (platform === "glovo") return "glovo";
  return "glovo";
}

/** Map API/report filter (may use bolt_courier) to driver_payouts.platform. */
export function payoutPlatformFromFilter(raw: string | null | undefined): DriverPayoutPlatform | null {
  if (!raw || !raw.trim()) return null;
  const v = raw.trim();
  if (v === "bolt_courier" || v === "bolt") return "bolt";
  if (v === "glovo") return "glovo";
  return null;
}

/** Earnings platform for querying earnings_records from payout platform. */
export function earningsPlatformFromPayout(platform: DriverPayoutPlatform): EarningsPlatform {
  return platform === "bolt" ? "bolt_courier" : "glovo";
}
