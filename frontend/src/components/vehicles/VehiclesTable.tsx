import type { VehicleListItem } from "../../api/vehicles";
import type { SortableHeaderProps } from "../../hooks/useListSort";
import { formatCurrency } from "../../utils/currency";
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
import { VehicleDriverCell } from "./VehicleDriverCell";
import { VehicleNameCell } from "./VehicleNameCell";
import { VehicleRowActions } from "./VehicleRowActions";
import { VehicleStatusBadge } from "./VehicleStatusBadge";

const checkboxClass =
  "h-4 w-4 rounded border-border text-brand focus:ring-2 focus:ring-brand/30 cursor-pointer";

type VehiclesTableProps = {
  vehicles: VehicleListItem[];
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
  onActionMenuToggle: (vehicleId: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  canCreate?: boolean;
  embedded?: boolean;
};

export function VehiclesTable({
  vehicles,
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
  canCreate = false,
  embedded = false,
}: VehiclesTableProps) {
  const shell = embedded ? "" : driversTableCard;

  if (isLoading) {
    return (
      <div className={`${shell} flex flex-col items-center justify-center gap-3 py-20`}>
        <span
          className="inline-block h-9 w-9 animate-spin rounded-full border-2 border-brand border-t-transparent"
          role="status"
          aria-label="Loading vehicles"
        />
        <p className="text-sm text-ink-muted">Loading vehicles…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={shell}>
        <EmptyState
          title="Failed to load vehicles"
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
          title="No vehicles yet"
          description="Add your first vehicle to start managing fleet assignments and availability."
          action={canCreate ? { label: "Add Vehicle", to: "/vehicles/new" } : undefined}
          className="border-0 py-16"
        />
      </div>
    );
  }

  if (showNoMatchEmpty) {
    return (
      <div className={shell}>
        <EmptyState
          title="No vehicles match your filters"
          description="Try adjusting search or filter criteria."
          className="border-0 py-16"
        />
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] table-fixed text-sm">
          <colgroup>
            <col className="w-[44px]" />
            <col className="min-w-[220px]" />
            <col className="w-[140px]" />
            <col className="w-[110px]" />
            <col className="w-[160px]" />
            <col className="min-w-[180px]" />
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
              <SortableTableHeader label="Vehicle" {...getHeaderProps("model")} className={tableCell} />
              <SortableTableHeader label="License Plate" {...getHeaderProps("plate_number")} className={tableCell} />
              <SortableTableHeader label="Status" {...getHeaderProps("status")} className={tableCell} />
              <SortableTableHeader
                label="Rent (Daily / Monthly)"
                {...getHeaderProps("weekly_rent")}
                className={tableCell}
              />
              <SortableTableHeader label="Current Driver" {...getHeaderProps("current_driver_id")} className={tableCell} />
              <th className={`${tableCell} w-[56px] text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle, index) => {
              const zebra = index % 2 === 0 ? driversTableRowOdd : driversTableRowEven;
              const selected = selectedIds.has(vehicle.id);
              return (
                <tr
                  key={vehicle.id}
                  className={`${zebra} ${driversTableRowHover} ${transitionDefault} ${
                    selected ? "bg-brand-mint/15" : ""
                  }`}
                >
                  <td className={`${tableCell} text-center align-middle`}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleRow(vehicle.id)}
                      aria-label={`Select ${vehicle.make} ${vehicle.model}`}
                      className={checkboxClass}
                    />
                  </td>
                  <td className={`${tableCell} align-middle`}>
                    <VehicleNameCell vehicle={vehicle} />
                  </td>
                  <td className={`${tableCell} align-middle`}>
                    <div className="font-mono text-sm text-ink">{vehicle.license_plate}</div>
                    {vehicle.vin && (
                      <div className="mt-0.5 truncate text-xs text-ink-muted">VIN: {vehicle.vin}</div>
                    )}
                  </td>
                  <td className={`${tableCell} align-middle`}>
                    <VehicleStatusBadge status={vehicle.status} />
                  </td>
                  <td className={`${tableCell} align-middle tabular-nums text-ink`}>
                    {formatCurrency(Number(vehicle.daily_rent))} / {formatCurrency(Number(vehicle.monthly_rent))}
                  </td>
                  <td className={`${tableCell} align-middle`}>
                    <VehicleDriverCell vehicle={vehicle} />
                  </td>
                  <td className={`${tableCell} align-middle text-right`}>
                    <VehicleRowActions
                      isActionMenuOpen={openMenuRowId === vehicle.id}
                      onActionMenuToggle={(e) => onActionMenuToggle(vehicle.id, e)}
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
