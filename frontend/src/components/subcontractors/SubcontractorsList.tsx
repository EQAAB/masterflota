import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import type { Subcontractor } from "../../api/subcontractors";
import { getSubcontractor, updateSubcontractor } from "../../api/subcontractors";
import { useUrlPagination } from "../../hooks/useUrlPagination";
import { useSubcontractorsListFilters } from "../../hooks/useSubcontractorsListFilters";
import { exportSubcontractorsCsv } from "../../utils/exportSubcontractorsCsv";
import { btnSecondary, btnDangerOutline, btnPrimary, driversPage } from "../../theme/classNames";
import { ActionMenuDropdown } from "../theme/ActionMenuDropdown";
import { DriversPagination } from "../drivers/DriversPagination";
import { buildSubcontractorActionMenuItems } from "./buildSubcontractorActionMenuItems";
import { SubcontractorsFilterBar } from "./SubcontractorsFilterBar";
import { SubcontractorsKpiCards } from "./SubcontractorsKpiCards";
import { SubcontractorsPageHeader } from "./SubcontractorsPageHeader";
import { SubcontractorsTable } from "./SubcontractorsTable";

type SubcontractorsListProps = {
  subcontractors: Subcontractor[] | undefined;
  isLoading: boolean;
  isError: boolean;
};

export function SubcontractorsList({ subcontractors, isLoading, isError }: SubcontractorsListProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { page, limit, setPage, setLimit } = useUrlPagination();
  const filters = useSubcontractorsListFilters(subcontractors);

  const {
    filteredSubcontractors,
    totalCount,
    filteredCount,
    isFilterPending,
    debouncedQuery,
    hasActiveFilters,
    clearAllFilters,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filtersExpanded,
    setFiltersExpanded,
    clearSearch,
  } = filters;

  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [disableTarget, setDisableTarget] = useState<Subcontractor | null>(null);
  const [assignTarget, setAssignTarget] = useState<Subcontractor | null>(null);
  const skipPageReset = useRef(true);

  useEffect(() => {
    if (skipPageReset.current) {
      skipPageReset.current = false;
      return;
    }
    setPage(1);
  }, [debouncedQuery, statusFilter, setPage]);

  const idIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    (subcontractors ?? []).forEach((s, i) => map.set(s.id, i));
    return map;
  }, [subcontractors]);

  const totalPages = Math.max(1, Math.ceil(filteredSubcontractors.length / limit));
  const safePage = Math.min(page, totalPages);

  const paginatedSubcontractors = useMemo(() => {
    const start = (safePage - 1) * limit;
    return filteredSubcontractors.slice(start, start + limit);
  }, [filteredSubcontractors, safePage, limit]);

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

  const openMenuSubcontractor = openMenuRowId
    ? filteredSubcontractors.find((s) => s.id === openMenuRowId)
    : undefined;

  const openMenuItems = useMemo(() => {
    if (!openMenuSubcontractor) return [];
    const isActive = openMenuSubcontractor.status === "active";
    return buildSubcontractorActionMenuItems({
      isActive,
      onView: () => {
        closeActionMenu();
        navigate(`/subcontractors/${openMenuSubcontractor.id}/edit`);
      },
      onEdit: () => {
        closeActionMenu();
        navigate(`/subcontractors/${openMenuSubcontractor.id}/edit`);
      },
      onAssignDrivers: () => {
        closeActionMenu();
        setAssignTarget(openMenuSubcontractor);
      },
      onViewReports: () => {
        closeActionMenu();
        navigate("/earnings/subcontractors/settlements");
      },
      onDisable: () => {
        closeActionMenu();
        setDisableTarget(openMenuSubcontractor);
      },
    });
  }, [openMenuSubcontractor, closeActionMenu, navigate]);

  const { data: assignDetail } = useQuery({
    queryKey: ["subcontractors", assignTarget?.id, "assign-drivers"],
    queryFn: () => getSubcontractor(assignTarget!.id).then((r) => r.data),
    enabled: assignTarget !== null,
  });

  const disableMutation = useMutation({
    mutationFn: (sub: Subcontractor) =>
      updateSubcontractor(sub.id, {
        legalName: sub.legal_name,
        registrationType: sub.registration_type,
        registrationNumber: sub.registration_number,
        taxId: sub.tax_id,
        email: sub.email,
        phone: sub.phone,
        address: sub.address,
        bankName: sub.bank_name,
        bankAccountIban: sub.bank_account_iban,
        status: "inactive",
        contractStartDate: sub.contract_start_date,
        contractEndDate: sub.contract_end_date,
        notes: sub.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcontractors"] });
      setDisableTarget(null);
    },
  });

  const handleExport = () => {
    exportSubcontractorsCsv(filteredSubcontractors, idIndexMap);
  };

  return (
    <>
      <SubcontractorsPageHeader onExport={handleExport} exportDisabled={filteredSubcontractors.length === 0} />

      <div className={driversPage}>
        <SubcontractorsKpiCards subcontractors={subcontractors} />

        <SubcontractorsFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={clearSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
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
          <SubcontractorsTable
            subcontractors={paginatedSubcontractors}
            idIndexMap={idIndexMap}
            isLoading={isLoading}
            isError={isError}
            showEmptyOrg={showEmptyOrg}
            showNoMatchEmpty={showNoMatchEmpty}
            openMenuRowId={openMenuRowId}
            onActionMenuToggle={handleActionMenuToggle}
            embedded
          />
          {!isLoading && !isError && filteredCount > 0 && (
            <DriversPagination
              page={safePage}
              pageSize={limit}
              totalItems={filteredCount}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setLimit(size);
                setPage(1);
              }}
              selectId="subcontractors-page-size"
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
            <h3 className="text-lg font-semibold text-ink">Assign drivers</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Drivers assigned to {assignTarget.legal_name}. Edit a driver to change subcontractor assignment.
            </p>
            <div className="mt-4 max-h-64 overflow-y-auto rounded-xl border border-border">
              {assignDetail?.drivers?.length ? (
                <ul className="divide-y divide-border">
                  {assignDetail.drivers.map((d) => (
                    <li key={d.id}>
                      <Link
                        to={`/drivers/${d.id}/edit`}
                        className="flex items-center justify-between px-4 py-3 text-sm hover:bg-surface"
                        onClick={() => setAssignTarget(null)}
                      >
                        <span className="font-medium text-ink">
                          {d.first_name} {d.last_name}
                        </span>
                        <span className="text-xs capitalize text-ink-muted">{d.employment_status}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-6 text-center text-sm text-ink-muted">
                  No drivers assigned yet.{" "}
                  <Link to="/drivers/new" className="text-brand hover:underline" onClick={() => setAssignTarget(null)}>
                    Add a driver
                  </Link>
                </p>
              )}
            </div>
            <div className="mt-5 flex gap-2">
              <Link
                to="/drivers"
                className={`${btnPrimary} flex-1 justify-center`}
                onClick={() => setAssignTarget(null)}
              >
                Go to drivers
              </Link>
              <button type="button" onClick={() => setAssignTarget(null)} className={`${btnSecondary} flex-1 justify-center`}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {disableTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-card p-6 shadow-card-hover">
            <h3 className="text-lg font-semibold text-ink">Disable subcontractor?</h3>
            <p className="mt-2 text-sm text-ink-muted">
              {disableTarget.legal_name} will be marked as inactive and hidden from active fleet operations.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => disableMutation.mutate(disableTarget)}
                disabled={disableMutation.isPending}
                className={`${btnDangerOutline} flex-1 justify-center`}
              >
                {disableMutation.isPending ? "Disabling…" : "Disable"}
              </button>
              <button
                type="button"
                onClick={() => setDisableTarget(null)}
                disabled={disableMutation.isPending}
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
