import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { DriverListItem } from "../../api/drivers";
import { updateDriver } from "../../api/drivers";
import { getLoansSummary } from "../../api/driverLoans";
import {
  formatCsvImportSummaryMessage,
  importDriversCsv,
} from "../../api/entityCsvImport";
import { useDriversListFilters } from "../../hooks/useDriversListFilters";
import type { SortableHeaderProps } from "../../hooks/useListSort";
import { exportDriversCsv } from "../../utils/exportDriversCsv";
import { usePermission } from "../../lib/permissions";
import { btnSecondary, btnDangerOutline, driversPage } from "../../theme/classNames";
import { ActionMenuDropdown } from "../theme/ActionMenuDropdown";
import { buildDriverActionMenuItems } from "./buildDriverActionMenuItems";
import { DriversFilterBar } from "./DriversFilterBar";
import { DriversPageHeader } from "./DriversPageHeader";
import { DriversPagination } from "./DriversPagination";
import { DriversTable } from "./DriversTable";
import { LoanFleetSummaryStrip } from "./LoanFleetSummaryStrip";

type DriversListProps = {
  drivers: DriverListItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  getHeaderProps: (field: string) => SortableHeaderProps;
};

export function DriversList({ drivers, isLoading, isError, getHeaderProps }: DriversListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canCreate = usePermission("drivers.create");
  const canEdit = usePermission("drivers.edit");
  const canImport = usePermission("imports.create");

  const loansSummaryQuery = useQuery({
    queryKey: ["drivers", "loans", "summary"],
    queryFn: () => getLoansSummary().then((r) => r.data),
  });

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
  const [importMessage, setImportMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!importMessage) return;
    const t = window.setTimeout(() => setImportMessage(null), 8000);
    return () => window.clearTimeout(t);
  }, [importMessage]);

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
      canEdit,
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
  }, [openMenuDriver, closeActionMenu, navigate, canEdit]);

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

  const importMutation = useMutation({
    mutationFn: importDriversCsv,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
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
        text: msg ?? t("pages.driversList.importFailedDefault"),
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
      <DriversPageHeader
        onExport={() => exportDriversCsv(filteredDrivers)}
        onImport={() => importInputRef.current?.click()}
        importBusy={importMutation.isPending}
        exportDisabled={filteredDrivers.length === 0}
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

      {loansSummaryQuery.data && (
        <div className="mx-auto max-w-[1600px] px-4 pt-3 sm:px-6 lg:px-8">
          <LoanFleetSummaryStrip
            data={loansSummaryQuery.data}
            action={
              <Link
                to="/earnings/loans"
                className="text-xs font-medium text-sky-800 hover:underline"
              >
                {t("pages.driversList.viewLoanReport")}
              </Link>
            }
          />
        </div>
      )}

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
            canCreate={canCreate}
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
            <h3 className="text-lg font-semibold text-ink">{t("pages.driversList.suspendModalTitle")}</h3>
            <p className="mt-2 text-sm text-ink-muted">
              {t("pages.driversList.suspendModalBody", {
                name: `${suspendTarget.first_name} ${suspendTarget.last_name}`,
              })}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => suspendMutation.mutate(suspendTarget.id)}
                disabled={suspendMutation.isPending}
                className={`${btnDangerOutline} flex-1 justify-center`}
              >
                {suspendMutation.isPending ? t("pages.driversList.suspending") : t("pages.driversList.suspend")}
              </button>
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                disabled={suspendMutation.isPending}
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
