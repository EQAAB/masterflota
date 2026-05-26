import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DriverListItem } from "../../api/drivers";
import { updateDriver } from "../../api/drivers";
import { useDriversListFilters } from "../../hooks/useDriversListFilters";
import type { SortableHeaderProps } from "../../hooks/useListSort";
import { exportDriversCsv } from "../../utils/exportDriversCsv";
import { btnSecondary, btnDangerOutline, driversPage } from "../../theme/classNames";
import { ActionMenuDropdown } from "../theme/ActionMenuDropdown";
import { buildDriverActionMenuItems } from "./buildDriverActionMenuItems";
import { DriversFilterBar } from "./DriversFilterBar";
import { DriversPageHeader } from "./DriversPageHeader";
import { DriversPagination } from "./DriversPagination";
import { DriversTable } from "./DriversTable";

type DriversListProps = {
  drivers: DriverListItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  getHeaderProps: (field: string) => SortableHeaderProps;
};

export function DriversList({ drivers, isLoading, isError, getHeaderProps }: DriversListProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const filters = useDriversListFilters(drivers);
  const {
    filteredDrivers,
    totalCount,
    filteredCount,
    isFilterPending,
    debouncedQuery,
    hasActiveFilters,
    clearAllFilters,
  } = filters;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<DriverListItem | null>(null);

  useEffect(() => {
    setPage(1);
  }, [
    filters.searchQuery,
    filters.statusFilter,
    filters.subcontractorFilter,
    filters.platformFilter,
    filters.debouncedQuery,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedDrivers = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredDrivers.slice(start, start + pageSize);
  }, [filteredDrivers, safePage, pageSize]);

  const pageIds = useMemo(() => paginatedDrivers.map((d) => d.id), [paginatedDrivers]);
  const pageAllSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const pageSomeSelected = pageIds.some((id) => selectedIds.has(id));

  const showEmptyOrg = !isLoading && !isError && totalCount === 0;
  const showNoMatchEmpty =
    !isLoading && !isError && totalCount > 0 && filteredCount === 0 && !isFilterPending;

  const closeActionMenu = useCallback(() => {
    setOpenMenuRowId(null);
    setMenuAnchorEl(null);
  }, []);

  const handleActionMenuToggle = useCallback(
    (rowId: string, event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (openMenuRowId === rowId) {
        closeActionMenu();
        return;
      }
      setOpenMenuRowId(rowId);
      setMenuAnchorEl(event.currentTarget);
    },
    [openMenuRowId, closeActionMenu],
  );

  const openMenuDriver = openMenuRowId
    ? filteredDrivers.find((d) => d.id === openMenuRowId)
    : undefined;

  const openMenuItems = useMemo(() => {
    if (!openMenuDriver) return [];
    const canSuspend = openMenuDriver.employment_status === "active";
    return buildDriverActionMenuItems({
      canSuspend,
      onViewProfile: () => {
        closeActionMenu();
        navigate(`/drivers/${openMenuDriver.id}`);
      },
      onEdit: () => {
        closeActionMenu();
        navigate(`/drivers/${openMenuDriver.id}/edit`);
      },
      onSuspend: () => {
        closeActionMenu();
        setSuspendTarget(openMenuDriver);
      },
    });
  }, [openMenuDriver, closeActionMenu, navigate]);

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePageSelection = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const suspendMutation = useMutation({
    mutationFn: (id: string) => updateDriver(id, { employmentStatus: "suspended" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setSuspendTarget(null);
    },
  });

  return (
    <>
      <DriversPageHeader
        onExport={() => exportDriversCsv(filteredDrivers)}
        exportDisabled={filteredDrivers.length === 0}
      />

      <div className={driversPage}>
        <DriversFilterBar
          searchQuery={filters.searchQuery}
          onSearchChange={filters.setSearchQuery}
          onClearSearch={filters.clearSearch}
          statusFilter={filters.statusFilter}
          onStatusChange={filters.setStatusFilter}
          subcontractorFilter={filters.subcontractorFilter}
          onSubcontractorChange={filters.setSubcontractorFilter}
          platformFilter={filters.platformFilter}
          onPlatformChange={filters.setPlatformFilter}
          filtersExpanded={filters.filtersExpanded}
          onToggleFilters={() => filters.setFiltersExpanded((e) => !e)}
          totalCount={totalCount}
          filteredCount={filteredCount}
          isFilterPending={isFilterPending}
          debouncedQuery={debouncedQuery}
          hasActiveFilters={hasActiveFilters}
          onClearAllFilters={clearAllFilters}
        />

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface-card shadow-card">
          <DriversTable
            drivers={paginatedDrivers}
            isLoading={isLoading}
            isError={isError}
            showEmptyOrg={showEmptyOrg}
            showNoMatchEmpty={showNoMatchEmpty}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onTogglePageSelection={togglePageSelection}
            pageAllSelected={pageAllSelected}
            pageSomeSelected={pageSomeSelected}
            getHeaderProps={getHeaderProps}
            openMenuRowId={openMenuRowId}
            onActionMenuToggle={handleActionMenuToggle}
            embedded
          />
          {!isLoading && !isError && filteredCount > 0 && (
            <DriversPagination
              page={safePage}
              pageSize={pageSize}
              totalItems={filteredCount}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          )}
        </div>
      </div>

      <ActionMenuDropdown
        open={openMenuRowId !== null && menuAnchorEl !== null}
        anchorEl={menuAnchorEl}
        items={openMenuItems}
        align="right"
        onClose={closeActionMenu}
      />

      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-card p-6 shadow-card-hover">
            <h3 className="text-lg font-semibold text-ink">Suspend driver?</h3>
            <p className="mt-2 text-sm text-ink-muted">
              {suspendTarget.first_name} {suspendTarget.last_name} will be marked as suspended and
              removed from active fleet operations until reactivated.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => suspendMutation.mutate(suspendTarget.id)}
                disabled={suspendMutation.isPending}
                className={`${btnDangerOutline} flex-1 justify-center`}
              >
                {suspendMutation.isPending ? "Suspending…" : "Suspend"}
              </button>
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                disabled={suspendMutation.isPending}
                className={`${btnSecondary} flex-1 justify-center`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
