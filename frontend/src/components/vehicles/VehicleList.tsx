import { Link } from "react-router-dom";
import type { PaginationMeta, VehicleListItem } from "../../api/vehicles";
import type { SortableHeaderProps } from "../../hooks/useListSort";
import { formatCurrency } from "../../utils/currency";
import { DriversPagination } from "../drivers/DriversPagination";
import { SortableTableHeader } from "../UI/SortableTableHeader";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  rented: "bg-blue-100 text-blue-800",
  maintenance: "bg-amber-100 text-amber-800",
  sold: "bg-slate-100 text-ink",
  scrapped: "bg-red-100 text-red-800",
};

type VehicleListProps = {
  vehicles: VehicleListItem[] | undefined;
  pagination: PaginationMeta | undefined;
  isLoading: boolean;
  isError: boolean;
  userRole?: string;
  onDeleteRequest: (vehicle: VehicleListItem) => void;
  getHeaderProps: (field: string) => SortableHeaderProps;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchClear: () => void;
  isSearchPending: boolean;
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function VehicleList({
  vehicles,
  pagination,
  isLoading,
  isError,
  userRole,
  onDeleteRequest,
  getHeaderProps,
  page,
  limit,
  onPageChange,
  onLimitChange,
  searchQuery,
  onSearchChange,
  onSearchClear,
  isSearchPending,
}: VehicleListProps) {
  const showDelete = userRole === "admin" || userRole === "accountant";
  const hasQuery = searchQuery.trim().length > 0;
  const totalCount = pagination?.total ?? 0;
  const filteredCount = totalCount;
  const rows = vehicles ?? [];

  const showNoMatchEmpty =
    !isLoading && !isError && hasQuery && filteredCount === 0 && !isSearchPending;
  const showEmptyOrg =
    !isLoading && !isError && totalCount === 0 && !hasQuery && !isSearchPending;

  return (
    <div className="space-y-4 p-4">
      <div className="w-full rounded-2xl border border-white/60 bg-white/45 p-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-md ring-1 ring-slate-900/[0.04] sm:p-4">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="vehicle-search" className="sr-only">
              Search vehicles by license plate, VIN, driver, make, model, or status
            </label>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              id="vehicle-search"
              type="search"
              autoComplete="off"
              placeholder="Search plate, VIN, driver, make/model, status…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full rounded-xl border border-white/50 bg-white/55 py-2.5 pl-10 text-sm text-ink shadow-inner outline-none ring-brand/30 placeholder:text-slate-400 focus:border-brand/30/80 focus:ring-2 ${hasQuery ? "pr-[4.5rem]" : "pr-3"}`}
            />
            {hasQuery && (
              <button
                type="button"
                onClick={onSearchClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-ink-muted hover:bg-white/70 hover:text-ink sm:text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        {!isLoading && !isError && (totalCount > 0 || hasQuery) && (
          <p className="mt-2 text-xs text-ink-muted sm:text-sm">
            {hasQuery && isSearchPending ? (
              <span className="text-ink-muted">Matching vehicles…</span>
            ) : hasQuery ? (
              <>
                Found{" "}
                <span className="font-semibold tabular-nums text-ink">
                  {filteredCount.toLocaleString()}
                </span>{" "}
                vehicle{filteredCount === 1 ? "" : "s"}
              </>
            ) : (
              <>
                <span className="font-semibold tabular-nums text-ink">
                  {totalCount.toLocaleString()}
                </span>{" "}
                vehicle{totalCount === 1 ? "" : "s"}
              </>
            )}
          </p>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-sky-600"
            role="status"
            aria-label="Loading vehicles"
          />
          <p className="text-sm text-ink-muted">Loading vehicles…</p>
        </div>
      )}

      {isError && <p className="px-1 text-sm text-red-600">Failed to load vehicles.</p>}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <SortableTableHeader label="Vehicle" {...getHeaderProps("model")} />
                  <SortableTableHeader label="License plate" {...getHeaderProps("plate_number")} />
                  <SortableTableHeader label="Status" {...getHeaderProps("status")} />
                  <SortableTableHeader label="Rent (daily / monthly)" {...getHeaderProps("weekly_rent")} />
                  <SortableTableHeader label="Current driver" {...getHeaderProps("current_driver_id")} />
                  <th className="px-3 py-2 text-left font-medium text-ink">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Link to={`/vehicles/${v.id}`} className="font-medium text-brand hover:text-brand-dark">
                        {v.year ? `${v.year} ` : ""}
                        {v.make} {v.model}
                      </Link>
                      <span className="ml-1 text-xs text-ink-muted">{v.vehicle_type}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-mono">{v.license_plate}</div>
                      {v.vin && <div className="mt-0.5 text-xs text-ink-muted">VIN: {v.vin}</div>}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${
                          STATUS_COLORS[v.status] ?? "bg-slate-100 text-ink"
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-ink">
                      {formatCurrency(Number(v.daily_rent))} / {formatCurrency(Number(v.monthly_rent))}
                    </td>
                    <td className="px-3 py-2 text-ink-muted">
                      {v.current_driver_id ? (
                        <Link
                          to={`/drivers/${v.current_driver_id}`}
                          className="text-brand hover:text-brand-dark text-sm"
                        >
                          {v.driver_first_name || v.driver_last_name
                            ? `${v.driver_first_name ?? ""} ${v.driver_last_name ?? ""}`.trim()
                            : "View driver"}
                          {v.driver_phone ? (
                            <span className="block text-xs text-ink-muted">{v.driver_phone}</span>
                          ) : null}
                        </Link>
                      ) : v.driver_first_name || v.driver_last_name ? (
                        `${v.driver_first_name ?? ""} ${v.driver_last_name ?? ""}`.trim()
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 flex items-center gap-3">
                      <Link
                        to={`/vehicles/${v.id}/edit`}
                        className="text-brand hover:text-brand-dark text-sm font-medium"
                      >
                        Edit
                      </Link>
                      {showDelete && (
                        <button
                          type="button"
                          onClick={() => onDeleteRequest(v)}
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {showEmptyOrg && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-sm text-ink-muted">
                      No vehicles yet.
                    </td>
                  </tr>
                )}
                {showNoMatchEmpty && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-sm text-ink-muted">
                      No vehicles match your search. Try a license plate, VIN, driver name, make/model, or status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalCount > 0 && (
            <DriversPagination
              page={page}
              pageSize={limit}
              totalItems={totalCount}
              onPageChange={onPageChange}
              onPageSizeChange={(size) => {
                onLimitChange(size);
                onPageChange(1);
              }}
              selectId="vehicle-page-size"
            />
          )}
        </div>
      )}
    </div>
  );
}
