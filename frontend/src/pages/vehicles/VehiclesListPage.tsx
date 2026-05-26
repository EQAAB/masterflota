import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVehicles, deleteVehicle, type VehicleListItem } from "../../api/vehicles";
import { VehiclesList } from "../../components/vehicles/VehiclesList";
import { useListSort } from "../../hooks/useListSort";
import { useUrlPagination } from "../../hooks/useUrlPagination";
import { useVehiclesListFilters } from "../../hooks/useVehiclesListFilters";
import { btnSecondary, btnDangerOutline } from "../../theme/classNames";

export function VehiclesListPage() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<VehicleListItem | null>(null);
  const { sortParams, getHeaderProps } = useListSort();
  const { page, limit, setPage, setLimit } = useUrlPagination();
  const filters = useVehiclesListFilters();

  const skipPageReset = useRef(true);

  useEffect(() => {
    if (skipPageReset.current) {
      skipPageReset.current = false;
      return;
    }
    setPage(1);
  }, [
    filters.debouncedQuery,
    filters.statusFilter,
    filters.subcontractorFilter,
    filters.platformFilter,
    sortParams,
    setPage,
  ]);

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "vehicles",
      page,
      limit,
      sortParams,
      filters.debouncedQuery,
      filters.statusFilter,
      filters.subcontractorFilter,
      filters.platformFilter,
    ],
    queryFn: async () => {
      const { data: res } = await getVehicles({
        page,
        limit,
        search: filters.debouncedQuery.trim() || undefined,
        status: filters.statusFilter !== "all" ? filters.statusFilter : undefined,
        subcontractor_id:
          filters.subcontractorFilter !== "all" ? filters.subcontractorFilter : undefined,
        platform: filters.platformFilter !== "all" ? filters.platformFilter : undefined,
        ...(sortParams ?? {}),
      });
      return res;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setDeleteTarget(null);
    },
  });

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated">
      <VehiclesList
        vehicles={data?.data}
        pagination={data?.pagination}
        isLoading={isLoading}
        isError={isError}
        getHeaderProps={getHeaderProps}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        filters={filters}
        onDeleteRequest={setDeleteTarget}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-card p-6 shadow-card-hover">
            <h3 className="text-lg font-semibold text-ink">Delete vehicle?</h3>
            <p className="mt-2 text-sm text-ink-muted">
              {deleteTarget.make} {deleteTarget.model} ({deleteTarget.license_plate}) will be
              permanently deleted. Rentals and maintenance records will be removed.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className={`${btnDangerOutline} flex-1 justify-center`}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
                className={`${btnSecondary} flex-1 justify-center`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
