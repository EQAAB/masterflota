import {
  PLATFORM_ID_LABELS,
  PLATFORM_IDS,
  type PlatformId,
} from "../../constants/platformIds";

export type LinkedDriverPlatformFields = {
  uber_driver_id?: string | null;
  bolt_driver_id?: string | null;
  glovo_courier_id?: string | null;
  bolt_courier_id?: string | null;
  bolt_taxi_driver_uuid?: string | null;
  wolt_courier_id?: string | null;
};

const PLATFORM_FIELD_MAP: { field: keyof LinkedDriverPlatformFields; platform: PlatformId }[] = [
  { field: "uber_driver_id", platform: PLATFORM_IDS.UBER },
  { field: "glovo_courier_id", platform: PLATFORM_IDS.GLOVO },
  { field: "bolt_courier_id", platform: PLATFORM_IDS.BOLT_COURIER },
  { field: "bolt_taxi_driver_uuid", platform: PLATFORM_IDS.BOLT_TAXI },
  { field: "wolt_courier_id", platform: PLATFORM_IDS.WOLT },
  { field: "bolt_driver_id", platform: PLATFORM_IDS.BOLT },
];

export type FilledPlatformId = { platform: PlatformId; label: string; value: string };

/** Returns only non-empty platform courier IDs for compact display. */
export function getFilledPlatformIds(driver: LinkedDriverPlatformFields): FilledPlatformId[] {
  const out: FilledPlatformId[] = [];
  for (const { field, platform } of PLATFORM_FIELD_MAP) {
    const raw = driver[field];
    if (raw == null) continue;
    const value = String(raw).trim();
    if (!value) continue;
    out.push({ platform, label: PLATFORM_ID_LABELS[platform], value });
  }
  return out;
}

export function platformIdsSearchText(driver: LinkedDriverPlatformFields): string {
  return getFilledPlatformIds(driver)
    .map((p) => `${p.label} ${p.value}`)
    .join(" ")
    .toLowerCase();
}
