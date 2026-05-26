import { useEffect, useState } from "react";
import type { VehiclePlatformFilter } from "../api/vehicles";

const DEFAULT_DEBOUNCE_MS = 300;

export type VehicleStatusFilter = "all" | "available" | "rented" | "maintenance" | "sold" | "scrapped";

export function useVehiclesListFilters(debounceMs: number = DEFAULT_DEBOUNCE_MS) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatusFilter>("all");
  const [subcontractorFilter, setSubcontractorFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<VehiclePlatformFilter>("all");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(searchQuery), debounceMs);
    return () => window.clearTimeout(id);
  }, [searchQuery, debounceMs]);

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
    isFilterPending,
    hasActiveFilters,
    clearAllFilters,
    clearSearch: () => {
      setSearchQuery("");
      setDebouncedQuery("");
    },
  };
}
