import type { Subcontractor } from "../../api/subcontractors";
import { transitionDefault } from "../../theme/classNames";
import { EmptyState } from "../theme/EmptyState";
import { formatDriverCount } from "../../utils/subcontractorDisplay";
import { SubcontractorContactCell } from "./SubcontractorContactCell";
import { SubcontractorEmailCell } from "./SubcontractorEmailCell";
import { SubcontractorJoinedCell } from "./SubcontractorJoinedCell";
import { SubcontractorNameCell } from "./SubcontractorNameCell";
import { SubcontractorRowActions } from "./SubcontractorRowActions";
import { SubcontractorStatusBadge } from "./SubcontractorStatusBadge";

const tableCell = "px-4 py-4 lg:px-5 lg:py-[1.125rem] align-middle";
const tableHeaderCell = `${tableCell} text-left`;
const headerLabel =
  "text-[11px] font-semibold uppercase tracking-wider text-ink-muted";

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
  const shell = embedded ? "" : "overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm";

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
          action={{ label: "Add subcontractor", to: "/subcontractors/new" }}
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
        <table className="w-full min-w-[1080px] table-fixed text-sm">
          <colgroup>
            <col className="min-w-[240px]" />
            <col className="min-w-[160px]" />
            <col className="min-w-[200px]" />
            <col className="w-[110px]" />
            <col className="w-[100px]" />
            <col className="w-[130px]" />
            <col className="w-[56px]" />
          </colgroup>
          <thead className="bg-[#F7F8FC]">
            <tr>
              <th className={tableHeaderCell}>
                <span className={headerLabel}>Subcontractor</span>
              </th>
              <th className={tableHeaderCell}>
                <span className={headerLabel}>Contact</span>
              </th>
              <th className={tableHeaderCell}>
                <span className={headerLabel}>Email</span>
              </th>
              <th className={tableHeaderCell}>
                <span className={headerLabel}>Status</span>
              </th>
              <th className={tableHeaderCell}>
                <span className={headerLabel}>Drivers</span>
              </th>
              <th className={tableHeaderCell}>
                <span className={headerLabel}>Joined On</span>
              </th>
              <th className={`${tableHeaderCell} w-[56px] text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {subcontractors.map((sub, index) => {
              const isEven = index % 2 === 1;
              return (
                <tr
                  key={sub.id}
                  className={`${transitionDefault} ${
                    isEven ? "bg-[#FAFBFD]" : "bg-white"
                  } hover:bg-brand-mint/25`}
                >
                  <td className={tableCell}>
                    <SubcontractorNameCell subcontractor={sub} displayIndex={idIndexMap.get(sub.id)} />
                  </td>
                  <td className={tableCell}>
                    <SubcontractorContactCell subcontractor={sub} />
                  </td>
                  <td className={tableCell}>
                    <SubcontractorEmailCell subcontractor={sub} />
                  </td>
                  <td className={tableCell}>
                    <SubcontractorStatusBadge status={sub.status} />
                  </td>
                  <td className={`${tableCell} font-bold text-ink`}>
                    {formatDriverCount(sub.driver_count)}
                  </td>
                  <td className={tableCell}>
                    <SubcontractorJoinedCell createdAt={sub.created_at} />
                  </td>
                  <td className={`${tableCell} text-right`}>
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
