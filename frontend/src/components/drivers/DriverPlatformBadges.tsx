import type { DriverListItem } from "../../api/drivers";
import { PlatformBadge, type PlatformBadgeKey } from "./platformLogos";

function linkedPlatforms(driver: DriverListItem): PlatformBadgeKey[] {
  const out: PlatformBadgeKey[] = [];
  if (driver.bolt_driver_id?.trim() || driver.bolt_courier_id?.trim()) out.push("bolt");
  if (driver.glovo_courier_id?.trim()) out.push("glovo");
  if (driver.uber_driver_id?.trim()) out.push("uber");
  if (driver.wolt_courier_id?.trim()) out.push("wolt");
  return out;
}

export function DriverPlatformBadges({ driver }: { driver: DriverListItem }) {
  const platforms = linkedPlatforms(driver);
  if (platforms.length === 0) {
    return <span className="text-xs text-ink-muted">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {platforms.map((key) => (
        <PlatformBadge key={key} platform={key} />
      ))}
    </div>
  );
}
