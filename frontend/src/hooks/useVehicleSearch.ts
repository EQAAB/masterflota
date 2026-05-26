import { useEffect, useState } from "react";

const DEFAULT_DEBOUNCE_MS = 300;

export function useVehicleSearch(debounceMs: number = DEFAULT_DEBOUNCE_MS) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(searchQuery), debounceMs);
    return () => window.clearTimeout(id);
  }, [searchQuery, debounceMs]);

  const isFilterPending = searchQuery !== debouncedQuery;

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    clearSearch: () => {
      setSearchQuery("");
      setDebouncedQuery("");
    },
    isFilterPending,
  };
}
