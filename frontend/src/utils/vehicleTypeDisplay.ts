import i18n from "../i18n";
import type { VehicleListItem } from "../api/vehicles";

export type NormalizedVehicleType = "car" | "scooter" | "cycle" | "van" | "other";

export function normalizeVehicleType(raw: string | null | undefined): NormalizedVehicleType {
  const t = (raw ?? "").trim().toLowerCase();
  if (!t) return "other";
  if (/(cycle|bicycle|bike|e-bike|ebike)/.test(t)) return "cycle";
  if (/(scooter|moped|vespa|yadea)/.test(t)) return "scooter";
  if (/(van|minivan|bus)/.test(t)) return "van";
  if (/(car|sedan|suv|hatchback|pickup|truck|dacia|toyota|logan|corolla)/.test(t)) return "car";
  return "other";
}

export function formatVehicleDisplayName(v: Pick<VehicleListItem, "make" | "model">): string {
  return `${v.make ?? ""} ${v.model ?? ""}`.trim() || i18n.t("vehicleType.unnamed");
}

export function formatVehicleTypeLabel(raw: string | null | undefined): string {
  const normalized = normalizeVehicleType(raw);
  if (normalized === "cycle") return i18n.t("vehicleType.cycle");
  if (normalized === "scooter") return i18n.t("vehicleType.scooter");
  if (normalized === "van") return i18n.t("vehicleType.van");
  if (normalized === "car") return i18n.t("vehicleType.car");
  const t = (raw ?? "").trim();
  if (!t) return i18n.t("vehicleType.generic");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function getDriverDisplayId(v: VehicleListItem): string | null {
  const ids = [
    v.driver_bolt_driver_id,
    v.driver_glovo_courier_id,
    v.driver_bolt_courier_id,
    v.driver_uber_driver_id,
    v.driver_wolt_courier_id,
    v.driver_phone,
  ];
  for (const id of ids) {
    const trimmed = id?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}
