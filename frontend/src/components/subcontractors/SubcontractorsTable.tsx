import type { Subcontractor } from "../../api/subcontractors";
import {
  driversTableCard,
  driversTableRowEven,
  driversTableRowHover,
  driversTableRowOdd,
  tableCell,
  tableHeader,
  transitionDefault,
} from "../../theme/classNames";
import { EmptyState } from "../theme/EmptyState";
import { formatDriverCount } from "../../utils/subcontractorDisplay";
import { SubcontractorContactCell } from "./SubcontractorContactCell";
import { SubcontractorJoinedCell } from "./SubcontractorJoinedCell";
import { SubcontractorNameCell } from "./SubcontractorNameCell";
import { SubcontractorRowActions } from "./SubcontractorRowActions";
import { SubcontractorStatusBadge } from "./SubcontractorStatusBadge";

type SubcontractorsTableProps = {
  subcontractors: Subcontractor[];
  idIndexMap: Map<string, number>;
  isLoading: boolean;
  isError: boolean;
  showEmptyOrg: boolean;
  showNoMatchEmpty: boolean;
  openMenuRowId: string | null;
  onActionMenuToggle: (subcontractorId: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  embedded?: boolean;
};

export function SubcontractorsTable({
  subcontractors,
  idIndexMap,
  isLoading,
  isError,
  showEmptyOrg,
  showNoMatchEmpty,
  openMenuRowId,
  onActionMenuToggle,
  embedded = false,
}: SubcontractorsTableProps) {
  const shell = embedded ? "" : driversTableCard;

  if (isLoading) {
    return (
      <div className={`${shell} flex flex-col items-center justify-center gap-3 py-20`}>
        <span
          className="inline-block h-9 w-9 animate-spin rounded-full border-2 border-brand border-t-transparent"
          role="status"
          aria-label="Loading subcontractors"
        />
        <p className="text-sm text-ink-muted">Loading subcontractors…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={shell}>
        <EmptyState
          title="Failed to load subcontractors"
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
          title="No subcontractors yet"
          description="Add your first subcontractor to start managing B2B fleet partnerships."
          action={{ label: "Add subcontractor", href: "/subcontractors/new" }}
          className="border-0 py-16"
        />
      </div>
    );
  }

  if (showNoMatchEmpty) {
    return (
      <div className={shell}>
        <EmptyState
          title="No subcontractors match your filters"
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
            <col className="min-w-[240px]" />
            <col className="min-w-[200px]" />
            <col className="w-[110px]" />
            <col className="w-[120px]" />
            <col className="w-[140px]" />
            <col className="w-[56px]" />
          </colgroup>
          <thead className={tableHeader}>
            <tr>
              <th className={tableCell}>
                <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Subcontractor</span>
              </th>
              <th className={tableCell}>
                <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Contact</span>
              </th>
              <th className={tableCell}>
                <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Status</span>
              </th>
              <th className={tableCell}>
                <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Drivers</span>
              </th>
              <th className={tableCell}>
                <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Joined On</span>
              </th>
              <th className={`${tableCell} w-[56px] text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {subcontractors.map((sub, index) => {
              const zebra = index % 2 === 0 ? driversTableRowOdd : driversTableRowEven;
              return (
                <tr key={sub.id} className={`${zebra} ${driversTableRowHover} ${transitionDefault}`}>
                  <td className={`${tableCell} align-middle`}>
                    <SubcontractorNameCell
                      subcontractor={sub}
                      displayIndex={idIndexMap.get(sub.id)}
                    />
                  </td>
                  <td className={`${tableCell} align-middle`}>
                    <SubcontractorContactCell subcontractor={sub} />
                  </td>
                  <td className={`${tableCell} align-middle`}>
                    <SubcontractorStatusBadge status={sub.status} />
                  </td>
                  <td className={`${tableCell} align-middle font-medium text-ink`}>
                    {formatDriverCount(sub.driver_count)}
                  </td>
                  <td className={`${tableCell} align-middle`}>
                    <SubcontractorJoinedCell createdAt={sub.created_at} />
                  </td>
                  <td className={`${tableCell} align-middle text-right`}>
                    <SubcontractorRowActions
                      isActionMenuOpen={openMenuRowId === sub.id}
                      onActionMenuToggle={(e) => onActionMenuToggle(sub.id, e)}
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
