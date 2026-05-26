import type { DriverListItem } from "../api/drivers";
import {
  driverHasAssignedVehicle,
  formatDriverVehicleLabel,
} from "./driverVehicleDisplay";

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function exportDriversCsv(drivers: DriverListItem[]): void {
  const includeVehicle = drivers.some(driverHasAssignedVehicle);

  const headers = [
    "First name",
    "Last name",
    "Phone",
    "Status",
    "Subcontractor",
    "Commission %",
    ...(includeVehicle ? ["Vehicle"] : []),
    "Uber ID",
    "Bolt ID",
    "Glovo ID",
    "Bolt courier ID",
    "Wolt ID",
    "Driver ID",
  ];

  const rows = drivers.map((d) => {
    const base = [
      d.first_name,
      d.last_name,
      d.phone,
      d.employment_status,
      d.subcontractor_legal_name ?? "",
      d.commission_rate,
    ];
    if (includeVehicle) {
      base.push(formatDriverVehicleLabel(d) ?? "—");
    }
    base.push(
      d.uber_driver_id ?? "",
      d.bolt_driver_id ?? "",
      d.glovo_courier_id ?? "",
      d.bolt_courier_id ?? "",
      d.wolt_courier_id ?? "",
      d.id,
    );
    return base.map((c) => escapeCsv(String(c))).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `drivers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
