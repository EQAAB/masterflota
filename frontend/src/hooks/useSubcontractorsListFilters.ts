import { useEffect, useMemo, useState } from "react";
import type { Subcontractor } from "../api/subcontractors";

const DEFAULT_DEBOUNCE_MS = 300;

export type SubcontractorStatusFilter = "all" | "active" | "inactive";

function subcontractorMatchesQuery(sub: Subcontractor, q: string): boolean {
  const n = q.trim().toLowerCase();
  if (!n) return true;

  const haystacks = [
    sub.legal_name,
    sub.phone ?? "",
    sub.email ?? "",
    sub.registration_number ?? "",
    sub.tax_id ?? "",
    sub.address ?? "",
  ];

  return haystacks.some((chunk) => String(chunk).toLowerCase().includes(n));
}

export function useSubcontractorsListFilters(
  subcontractors: Subcontractor[] | undefined,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubcontractorStatusFilter>("all");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(searchQuery), debounceMs);
    return () => window.clearTimeout(id);
  }, [searchQuery, debounceMs]);

  const filteredSubcontractors = useMemo(() => {
    if (!subcontractors?.length) return [];
    return subcontractors.filter((s) => {
      if (!subcontractorMatchesQuery(s, debouncedQuery)) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      return true;
    });
  }, [subcontractors, debouncedQuery, statusFilter]);

  const totalCount = subcontractors?.length ?? 0;
  const filteredCount = filteredSubcontractors.length;
  const isFilterPending = searchQuery !== debouncedQuery;
  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setStatusFilter("all");
  };

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    statusFilter,
    setStatusFilter,
    filtersExpanded,
    setFiltersExpanded,
    filteredSubcontractors,
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
