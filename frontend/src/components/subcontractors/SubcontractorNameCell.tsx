import { Link } from "react-router-dom";
import type { Subcontractor } from "../../api/subcontractors";
import {
  formatSubcontractorDisplayId,
  subcontractorAvatarClass,
  subcontractorAvatarTone,
  subcontractorInitials,
} from "../../utils/subcontractorDisplay";

type SubcontractorNameCellProps = {
  subcontractor: Subcontractor;
  displayIndex?: number;
};

export function SubcontractorNameCell({ subcontractor, displayIndex }: SubcontractorNameCellProps) {
  const tone = subcontractorAvatarTone(subcontractor.id);
  const displayId = formatSubcontractorDisplayId(subcontractor, displayIndex);

  return (
    <Link to={`/subcontractors/${subcontractor.id}/edit`} className="group flex min-w-0 items-center gap-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${subcontractorAvatarClass(tone)}`}
        aria-hidden
      >
        {subcontractorInitials(subcontractor.legal_name)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink group-hover:text-brand">{subcontractor.legal_name}</p>
        <p className="truncate text-xs text-ink-muted tabular-nums">ID: {displayId}</p>
      </div>
    </Link>
  );
}
