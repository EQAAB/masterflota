import type { VehicleStatus } from "../../api/vehicles";

const STATUS_STYLES: Record<VehicleStatus, string> = {
  available: "bg-success/10 text-success",
  rented: "bg-warning/10 text-warning",
  maintenance: "bg-danger/10 text-danger",
  sold: "bg-surface text-ink-muted ring-1 ring-border",
  scrapped: "bg-surface text-ink-muted ring-1 ring-border",
};

export function VehicleStatusBadge({ status }: { status: VehicleStatus | string }) {
  const normalized = (status ?? "").toLowerCase() as VehicleStatus;
  const style = STATUS_STYLES[normalized] ?? "bg-surface text-ink-muted ring-1 ring-border";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${style}`}>
      {normalized || "unknown"}
    </span>
  );
}
