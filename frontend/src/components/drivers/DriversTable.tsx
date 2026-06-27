import { Link } from "react-router-dom";
import type { DriverListItem } from "../../api/drivers";
import type { SortableHeaderProps } from "../../hooks/useListSort";
import {
  driversTableCard,
  driversTableRowEven,
  driversTableRowHover,
  driversTableRowOdd,
  tableCell,
  tableHeader,
  transitionDefault,
} from "../../theme/classNames";
import { SortableTableHeader } from "../UI/SortableTableHeader";
import { EmptyState } from "../theme/EmptyState";
import { DriverAvatar } from "./DriverAvatar";
import { DriverPlatformBadges } from "./DriverPlatformBadges";
import { DriverRowActions } from "./DriverRowActions";
import { DriverStatusBadge } from "./DriverStatusBadge";
import { DriverVehicleCell } from "./DriverVehicleCell";

const checkboxClass =
  "h-4 w-4 rounded border-border text-brand focus:ring-2 focus:ring-brand/30 cursor-pointer";

function shortDriverId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

type DriversTableProps = {
  drivers: DriverListItem[];
  isLoading: boolean;
  isError: boolean;
  showEmptyOrg: boolean;
  showNoMatchEmpty: boolean;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onTogglePageSelection: () => void;
  pageAllSelected: boolean;
  pageSomeSelected: boolean;
  getHeaderProps: (field: string) => SortableHeaderProps;
  openMenuRowId: string | null;
  onActionMenuToggle: (driverId: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  embedded?: boolean;
};

export function DriversTable({
  drivers,
  isLoading,
  isError,
  showEmptyOrg,
  showNoMatchEmpty,
  selectedIds,
  onToggleRow,
  onTogglePageSelection,
  pageAllSelected,
  pageSomeSelected,
  getHeaderProps,
  openMenuRowId,
  onActionMenuToggle,
  embedded = false,
}: DriversTableProps) {
  const shell = embedded ? "" : driversTableCard;

  if (isLoading) {
    return (
      <div className={`${shell} flex flex-col items-center justify-center gap-3 py-20`}>
        <span
          className="inline-block h-9 w-9 animate-spin rounded-full border-2 border-brand border-t-transparent"
          role="status"
          aria-label="Loading drivers"
        />
        <p className="text-sm text-ink-muted">Loading drivers…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={shell}>
        <EmptyState
          title="Failed to load drivers"
          description="Check your connection and refresh the page."
          className="border-0 py-16"
        />
      </div>
    );
  }

  if (showEmptyOrg) {
    return (
      <div className={shell}>
        <EmptyState
          title="No drivers yet"
          description="Add your first driver to start managing fleet assignments and payouts."
          action={{ label: "Add driver", to: "/drivers/new" }}
          className="border-0 py-16"
        />
      </div>
    );
  }

  if (showNoMatchEmpty) {
    return (
      <div className={shell}>
        <EmptyState
          title="No drivers match your filters"
          description="Try adjusting search or filter criteria."
          className="border-0 py-16"
        />
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] table-fixed text-sm">
          <colgroup>
            <col className="w-[44px]" />
            <col className="min-w-[220px]" />
            <col className="w-[120px]" />
            <col className="w-[110px]" />
            <col className="w-[160px]" />
            <col className="w-[100px]" />
            <col className="w-[140px]" />
            <col className="w-[160px]" />
            <col className="w-[56px]" />
          </colgroup>
          <thead className={tableHeader}>
            <tr>
              <th className={`${tableCell} w-[44px] text-center`}>
                <input
                  type="checkbox"
                  checked={pageAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = pageSomeSelected && !pageAllSelected;
                  }}
                  onChange={onTogglePageSelection}
                  aria-label="Select all on page"
                  className={checkboxClass}
                />
              </th>
              <SortableTableHeader label="Driver" {...getHeaderProps("last_name")} className={tableCell} />
              <SortableTableHeader
                label="Phone"
                {...getHeaderProps("phone")}
                className={`${tableCell} hidden lg:table-cell`}
              />
              <SortableTableHeader label="Status" {...getHeaderProps("employment_status")} className={tableCell} />
              <SortableTableHeader
                label="Subcontractor"
                {...getHeaderProps("subcontractor_id")}
                className={`${tableCell} hidden md:table-cell`}
              />
              <th className={`${tableCell} text-right`}>
                <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Commission</span>
              </th>
              <SortableTableHeader
                label="Vehicle"
                {...getHeaderProps("current_vehicle_id")}
                className={`${tableCell} hidden md:table-cell`}
              />
              <th className={tableCell}>
                <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Platform</span>
              </th>
              <th className={`${tableCell} w-[56px] text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver, index) => {
              const zebra = index % 2 === 0 ? driversTableRowOdd : driversTableRowEven;
              const selected = selectedIds.has(driver.id);
              return (
                <tr
                  key={driver.id}
                  className={`${zebra} ${driversTableRowHover} ${transitionDefault} ${
                    selected ? "bg-brand-mint/15" : ""
                  }`}
                >
                  <td className={`${tableCell} text-center align-middle`}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleRow(driver.id)}
                      aria-label={`Select ${driver.first_name} ${driver.last_name}`}
                      className={checkboxClass}
                    />
                  </td>
                  <td className={`${tableCell} align-middle`}>
                    <Link to={`/drivers/${driver.id}`} className="group flex min-w-0 items-center gap-3">
                      <DriverAvatar
                        driverId={driver.id}
                        profilePhotoUrl={driver.profile_photo_url}
                        firstName={driver.first_name}
                        lastName={driver.last_name}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink group-hover:text-brand">
                          {driver.first_name} {driver.last_name}
                        </p>
                        <p className="truncate text-xs text-ink-muted tabular-nums">
                          ID {shortDriverId(driver.id)}
                        </p>
                        <p className="truncate text-xs text-ink-muted tabular-nums lg:hidden">{driver.phone}</p>
                      </div>
                    </Link>
                  </td>
                  <td className={`${tableCell} hidden align-middle tabular-nums text-ink lg:table-cell`}>
                    {driver.phone}
                  </td>
                  <td className={`${tableCell} align-middle`}>
                    <DriverStatusBadge status={driver.employment_status} />
                  </td>
                  <td className={`${tableCell} hidden align-middle truncate text-ink-muted md:table-cell`}>
                    {driver.subcontractor_legal_name ?? "—"}
                  </td>
                  <td className={`${tableCell} align-middle text-right tabular-nums text-ink`}>
                    {driver.commission_rate}%
                  </td>
                  <td className={`${tableCell} hidden align-middle md:table-cell`}>
                    <DriverVehicleCell driver={driver} />
                  </td>
                  <td className={`${tableCell} align-middle`}>
                    <DriverPlatformBadges driver={driver} />
                  </td>
                  <td className={`${tableCell} align-middle text-right`}>
                    <DriverRowActions
                      driverId={driver.id}
                      isActionMenuOpen={openMenuRowId === driver.id}
                      onActionMenuToggle={(e) => onActionMenuToggle(driver.id, e)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
