import type { VehicleListItem } from "../api/vehicles";
import { formatVehicleDisplayName, formatVehicleTypeLabel, getDriverDisplayId } from "./vehicleTypeDisplay";

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function exportVehiclesCsv(vehicles: VehicleListItem[]): void {
  const headers = [
    "Vehicle",
    "Type",
    "License plate",
    "VIN",
    "Status",
    "Daily rent",
    "Monthly rent",
    "Current driver",
    "Driver ID",
    "Subcontractor",
  ];

  const rows = vehicles.map((v) => {
    const driverName =
      v.current_driver_id && (v.driver_first_name || v.driver_last_name)
        ? `${v.driver_first_name ?? ""} ${v.driver_last_name ?? ""}`.trim()
        : "";
    return [
      formatVehicleDisplayName(v),
      formatVehicleTypeLabel(v.vehicle_type),
      v.license_plate,
      v.vin ?? "",
      v.status,
      v.daily_rent,
      v.monthly_rent,
      driverName || "Unassigned",
      getDriverDisplayId(v) ?? "",
      v.driver_subcontractor_name ?? "",
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map((c) => escapeCsv(String(c))).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vehicles-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
