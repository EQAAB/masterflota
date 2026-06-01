import type { RentalPricing } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import type { PricingDisplayStatus } from "../rentalStatus";

export type PricingFilters = {
  q: string;
  vehicleType: string;
  pricingType: "" | "vehicle" | "default";
  vehicleStatus: string;
  activeOnly: boolean;
  sort: "plate" | "daily" | "weekly" | "monthly";
};

export function weeklySavingsPct(daily: number, weekly: number): number | null {
  const fullWeek = daily * 7;
  if (fullWeek <= 0 || weekly <= 0 || weekly >= fullWeek) return null;
  return Math.round(((fullWeek - weekly) / fullWeek) * 100);
}

export function depositLabel(deposit: number): "Required" | "Optional" {
  return deposit > 0 ? "Required" : "Optional";
}

export function derivePricingStatus(row: RentalPricing): PricingDisplayStatus {
  if (!row.is_active) return "draft";
  if (row.effective_from || row.effective_to) return "seasonal";
  const daily = Number(row.daily_rate);
  const weekly = Number(row.weekly_rate);
  const savings = weeklySavingsPct(daily, weekly);
  if (savings != null && savings >= 5) return "discounted";
  return "active";
}

export function vehicleDisplayName(row: RentalPricing): string {
  if (row.license_plate) {
    return `${row.make ?? ""} ${row.model ?? ""}`.trim();
  }
  if (row.vehicle_type) return `Default · ${row.vehicle_type}`;
  return "Default / all vehicles";
}

export function vehicleMeta(row: RentalPricing): string {
  const type = row.vehicle_type_name ?? row.vehicle_type ?? "";
  const trans = row.transmission ?? "";
  return [type, trans].filter(Boolean).join(" · ");
}

export function filterAndSortPricing(rows: RentalPricing[], filters: PricingFilters): RentalPricing[] {
  let list = [...rows];
  const q = filters.q.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (r) =>
        (r.license_plate ?? "").toLowerCase().includes(q) ||
        (r.make ?? "").toLowerCase().includes(q) ||
        (r.model ?? "").toLowerCase().includes(q) ||
        (r.vehicle_type ?? "").toLowerCase().includes(q),
    );
  }
  if (filters.vehicleType) {
    list = list.filter(
      (r) => r.vehicle_type === filters.vehicleType || r.vehicle_type_name === filters.vehicleType,
    );
  }
  if (filters.pricingType === "vehicle") {
    list = list.filter((r) => r.vehicle_id != null);
  } else if (filters.pricingType === "default") {
    list = list.filter((r) => r.vehicle_id == null);
  }
  if (filters.vehicleStatus) {
    list = list.filter((r) => r.vehicle_status === filters.vehicleStatus);
  }
  if (filters.activeOnly) {
    list = list.filter((r) => r.is_active);
  }

  list.sort((a, b) => {
    if (filters.sort === "daily") return Number(b.daily_rate) - Number(a.daily_rate);
    if (filters.sort === "weekly") return Number(b.weekly_rate) - Number(a.weekly_rate);
    if (filters.sort === "monthly") return Number(b.monthly_rate) - Number(a.monthly_rate);
    const plateA = a.license_plate ?? "zzz";
    const plateB = b.license_plate ?? "zzz";
    return plateA.localeCompare(plateB);
  });

  return list;
}

export function vehicleTypeOptions(rows: RentalPricing[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    if (r.vehicle_type_name) set.add(r.vehicle_type_name);
    else if (r.vehicle_type) set.add(r.vehicle_type);
  }
  return [...set].sort();
}

export function exportPricingCsv(rows: RentalPricing[]) {
  const headers = [
    "Vehicle",
    "Plate",
    "Daily",
    "Weekly",
    "Monthly",
    "Deposit",
    "Status",
    "Vehicle status",
    "Active",
  ];
  const data = rows.map((r) => [
    vehicleDisplayName(r),
    r.license_plate ?? "",
    formatCurrency(Number(r.daily_rate)),
    formatCurrency(Number(r.weekly_rate)),
    formatCurrency(Number(r.monthly_rate)),
    formatCurrency(Number(r.deposit_default)),
    derivePricingStatus(r),
    r.vehicle_status ?? "",
    r.is_active ? "yes" : "no",
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [headers, ...data].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rental-pricing-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
