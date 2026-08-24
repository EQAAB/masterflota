import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { DriverListItem } from "../../api/drivers";
import type { PaginationMeta, VehicleListItem, VehicleStatus } from "../../api/vehicles";
import { updateVehicle } from "../../api/vehicles";
import {
  formatCsvImportSummaryMessage,
  importVehiclesCsv,
} from "../../api/entityCsvImport";
import { assignDriverToVehicle } from "../../api/vehicleAssignments";
import { DriverSearchCombobox } from "../rentals/DriverSearchCombobox";
import { usePermission } from "../../lib/permissions";
import type { SortableHeaderProps } from "../../hooks/useListSort";
import type { useVehiclesListFilters } from "../../hooks/useVehiclesListFilters";
import { exportVehiclesCsv } from "../../utils/exportVehiclesCsv";
import { btnSecondary, btnPrimary, driversPage, input } from "../../theme/classNames";
import { ActionMenuDropdown } from "../theme/ActionMenuDropdown";
import { DriversPagination } from "../drivers/DriversPagination";
import { buildVehicleActionMenuItems } from "./buildVehicleActionMenuItems";
import { VehiclesFilterBar } from "./VehiclesFilterBar";
import { VehiclesPageHeader } from "./VehiclesPageHeader";
import { VehiclesTable } from "./VehiclesTable";

const VEHICLE_STATUS_VALUES: VehicleStatus[] = ["available", "rented", "maintenance", "sold", "scrapped"];

type VehiclesListProps = {
  vehicles: VehicleListItem[] | undefined;
  pagination: PaginationMeta | undefined;
  isLoading: boolean;
  isError: boolean;
  getHeaderProps: (field: string) => SortableHeaderProps;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  filters: ReturnType<typeof useVehiclesListFilters>;
  onDeleteRequest: (vehicle: VehicleListItem) => void;
};

export function VehiclesList({
  vehicles,
  pagination,
  isLoading,
  isError,
  getHeaderProps,
  page,
  limit,
  onPageChange,
  onLimitChange,
  filters,
  onDeleteRequest,
}: VehiclesListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canCreate = usePermission("vehicles.create");
  const canEdit = usePermission("vehicles.edit");
  const canAssign = usePermission("vehicles.assign");
  const canImport = usePermission("imports.create");
  const canDelete = usePermission("vehicles.delete");

  const rows = vehicles ?? [];
  const totalCount = pagination?.total ?? 0;
  const filteredCount = totalCount;

  const {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    statusFilter,
    setStatusFilter,
    platformFilter,
    setPlatformFilter,
    filtersExpanded,
    setFiltersExpanded,
    isFilterPending,
    hasActiveFilters,
    clearAllFilters,
    clearSearch,
  } = filters;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [assignTarget, setAssignTarget] = useState<VehicleListItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<VehicleListItem | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<DriverListItem | null>(null);
  const [newStatus, setNewStatus] = useState<VehicleStatus>("available");
  const [importMessage, setImportMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!importMessage) return;
    const t = window.setTimeout(() => setImportMessage(null), 8000);
    return () => window.clearTimeout(t);
  }, [importMessage]);

  const showEmptyOrg =
    !isLoading && !isError && totalCount === 0 && !hasActiveFilters && !isFilterPending;
  const showNoMatchEmpty =
    !isLoading && !isError && totalCount === 0 && (hasActiveFilters || debouncedQuery.trim().length > 0) && !isFilterPending;

  const pageIds = useMemo(() => rows.map((v) => v.id), [rows]);
  const pageAllSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const pageSomeSelected = pageIds.some((id) => selectedIds.has(id));

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

  const openMenuVehicle = openMenuRowId ? rows.find((v) => v.id === openMenuRowId) : undefined;

  const openMenuItems = useMemo(() => {
    if (!openMenuVehicle) return [];
    return buildVehicleActionMenuItems({
      canEdit,
      canAssign,
      canDelete,
      onView: () => {
        closeActionMenu();
        navigate(`/vehicles/${openMenuVehicle.id}`);
      },
      onEdit: () => {
        closeActionMenu();
        navigate(`/vehicles/${openMenuVehicle.id}/edit`);
      },
      onAssignDriver: () => {
        closeActionMenu();
        setAssignTarget(openMenuVehicle);
        setSelectedDriver(null);
      },
      onChangeStatus: () => {
        closeActionMenu();
        setStatusTarget(openMenuVehicle);
        setNewStatus(openMenuVehicle.status);
      },
      onDelete: () => {
        closeActionMenu();
        onDeleteRequest(openMenuVehicle);
      },
    });
  }, [openMenuVehicle, closeActionMenu, navigate, canEdit, canAssign, canDelete, onDeleteRequest]);

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

  const assignMutation = useMutation({
    mutationFn: ({ vehicleId, driverId }: { vehicleId: string; driverId: string }) =>
      assignDriverToVehicle(vehicleId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setAssignTarget(null);
      setSelectedDriver(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ vehicleId, status }: { vehicleId: string; status: VehicleStatus }) =>
      updateVehicle(vehicleId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setStatusTarget(null);
    },
  });

  const handleExport = () => {
    const toExport =
      selectedIds.size > 0 ? rows.filter((v) => selectedIds.has(v.id)) : rows;
    exportVehiclesCsv(toExport);
  };

  const importMutation = useMutation({
    mutationFn: importVehiclesCsv,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setImportMessage({
        type: "success",
        text: formatCsvImportSummaryMessage(res.data),
      });
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setImportMessage({
        type: "error",
        text: msg ?? t("pages.vehiclesList.importFailedDefault"),
      });
    },
  });

  const handleImportFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      importMutation.mutate(file);
    },
    [importMutation],
  );

  return (
    <>
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          handleImportFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <VehiclesPageHeader
        onExport={handleExport}
        onImport={() => importInputRef.current?.click()}
        importBusy={importMutation.isPending}
        exportDisabled={rows.length === 0}
        canCreate={canCreate}
        canImport={canImport}
      />

      {importMessage && (
        <div
          className={`mx-auto max-w-[1600px] px-4 pt-3 sm:px-6 lg:px-8 ${
            importMessage.type === "success" ? "text-brand" : "text-danger"
          }`}
        >
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              importMessage.type === "success"
                ? "border-brand/20 bg-brand/5"
                : "border-danger/20 bg-danger/5"
            }`}
          >
            {importMessage.text}
          </div>
        </div>
      )}

      <div className={driversPage}>
        <VehiclesFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={clearSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          platformFilter={platformFilter}
          onPlatformChange={setPlatformFilter}
          filtersExpanded={filtersExpanded}
          onToggleFilters={() => setFiltersExpanded((e) => !e)}
          totalCount={totalCount}
          filteredCount={filteredCount}
          isFilterPending={isFilterPending}
          debouncedQuery={debouncedQuery}
          hasActiveFilters={hasActiveFilters}
          onClearAllFilters={clearAllFilters}
        />

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface-card shadow-card">
          <VehiclesTable
            vehicles={rows}
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
            canCreate={canCreate}
            embedded
          />
          {!isLoading && !isError && filteredCount > 0 && (
            <DriversPagination
              page={page}
              pageSize={limit}
              totalItems={filteredCount}
              onPageChange={onPageChange}
              onPageSizeChange={(size) => {
                onLimitChange(size);
                onPageChange(1);
              }}
              selectId="vehicle-page-size"
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

      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface-card p-6 shadow-card-hover">
            <h3 className="text-lg font-semibold text-ink">{t("pages.vehiclesList.assignModalTitle")}</h3>
            <p className="mt-1 text-sm text-ink-muted">
              {t("pages.vehiclesList.assignModalBody", { vehicle: `${assignTarget.make} ${assignTarget.model}` })}
            </p>
            <div className="mt-4">
              <DriverSearchCombobox
                value={selectedDriver}
                onChange={setSelectedDriver}
                currentVehicleId={assignTarget.id}
                hideLabel
                disabled={assignMutation.isPending}
                inputClassName={input}
              />
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={!selectedDriver || assignMutation.isPending}
                onClick={() =>
                  assignMutation.mutate({ vehicleId: assignTarget.id, driverId: selectedDriver!.id })
                }
                className={`${btnPrimary} flex-1 justify-center`}
              >
                {assignMutation.isPending ? t("pages.vehiclesList.assigning") : t("pages.vehiclesList.assign")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignTarget(null);
                  setSelectedDriver(null);
                }}
                disabled={assignMutation.isPending}
                className={`${btnSecondary} flex-1 justify-center`}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-card p-6 shadow-card-hover">
            <h3 className="text-lg font-semibold text-ink">{t("pages.vehiclesList.changeStatusModalTitle")}</h3>
            <p className="mt-1 text-sm text-ink-muted">
              {t("pages.vehiclesList.changeStatusModalBody", { vehicle: `${statusTarget.make} ${statusTarget.model}` })}
            </p>
            <select
              className={`${input} mt-4`}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as VehicleStatus)}
            >
              {VEHICLE_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(`vehicleStatus.${value}`)}
                </option>
              ))}
            </select>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({ vehicleId: statusTarget.id, status: newStatus })
                }
                className={`${btnPrimary} flex-1 justify-center`}
              >
                {statusMutation.isPending ? t("common.saving") : t("common.save")}
              </button>
              <button
                type="button"
                onClick={() => setStatusTarget(null)}
                disabled={statusMutation.isPending}
                className={`${btnSecondary} flex-1 justify-center`}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
