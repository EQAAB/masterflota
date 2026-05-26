import { useEffect, useMemo, useState } from "react";
import type { DriverListItem } from "../api/drivers";

const DEFAULT_DEBOUNCE_MS = 300;

export type DriverStatusFilter = "all" | "active" | "suspended" | "terminated";
export type DriverPlatformFilter =
  | "all"
  | "bolt"
  | "glovo"
  | "bolt_glovo"
  | "uber"
  | "wolt";

function driverMatchesQuery(driver: DriverListItem, q: string): boolean {
  const n = q.trim().toLowerCase();
  if (!n) return true;

  const haystacks = [
    driver.first_name,
    driver.last_name,
    `${driver.first_name} ${driver.last_name}`,
    driver.phone,
    driver.id,
    driver.email ?? "",
    driver.employment_status,
    driver.address ?? "",
    driver.license_number ?? "",
    driver.uber_driver_id ?? "",
    driver.bolt_driver_id ?? "",
    driver.glovo_courier_id ?? "",
    driver.bolt_courier_id ?? "",
    driver.wolt_courier_id ?? "",
    driver.subcontractor_legal_name ?? "",
    driver.current_vehicle_license_plate ?? "",
    `${driver.current_vehicle_make ?? ""} ${driver.current_vehicle_model ?? ""}`.trim(),
  ];

  return haystacks.some((chunk) => String(chunk).toLowerCase().includes(n));
}

function hasBolt(driver: DriverListItem): boolean {
  return Boolean(driver.bolt_driver_id?.trim() || driver.bolt_courier_id?.trim());
}

function hasGlovo(driver: DriverListItem): boolean {
  return Boolean(driver.glovo_courier_id?.trim());
}

function matchesPlatformFilter(driver: DriverListItem, platform: DriverPlatformFilter): boolean {
  if (platform === "all") return true;
  if (platform === "bolt") return hasBolt(driver);
  if (platform === "glovo") return hasGlovo(driver);
  if (platform === "bolt_glovo") return hasBolt(driver) && hasGlovo(driver);
  if (platform === "uber") return Boolean(driver.uber_driver_id?.trim());
  if (platform === "wolt") return Boolean(driver.wolt_courier_id?.trim());
  return true;
}

export function useDriversListFilters(
  drivers: DriverListItem[] | undefined,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DriverStatusFilter>("all");
  const [subcontractorFilter, setSubcontractorFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<DriverPlatformFilter>("all");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(searchQuery), debounceMs);
    return () => window.clearTimeout(id);
  }, [searchQuery, debounceMs]);

  const filteredDrivers = useMemo(() => {
    if (!drivers?.length) return [];
    return drivers.filter((d) => {
      if (!driverMatchesQuery(d, debouncedQuery)) return false;
      if (statusFilter !== "all" && d.employment_status !== statusFilter) return false;
      if (subcontractorFilter !== "all" && d.subcontractor_id !== subcontractorFilter) return false;
      if (!matchesPlatformFilter(d, platformFilter)) return false;
      return true;
    });
  }, [drivers, debouncedQuery, statusFilter, subcontractorFilter, platformFilter]);

  const totalCount = drivers?.length ?? 0;
  const filteredCount = filteredDrivers.length;
  const isFilterPending = searchQuery !== debouncedQuery;
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "all" ||
    subcontractorFilter !== "all" ||
    platformFilter !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setStatusFilter("all");
    setSubcontractorFilter("all");
    setPlatformFilter("all");
  };

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    statusFilter,
    setStatusFilter,
    subcontractorFilter,
    setSubcontractorFilter,
    platformFilter,
    setPlatformFilter,
    filtersExpanded,
    setFiltersExpanded,
    filteredDrivers,
    totalCount,
    filteredCount,
    isFilterPending,
    hasActiveFilters,
    clearAllFilters,
    clearSearch: () => {
      setSearchQuery("");
      setDebouncedQuery("");
    },
  };
}
