import { formatJoinedDate } from "../../utils/subcontractorDisplay";

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
      />
    </svg>
  );
}

export function SubcontractorJoinedCell({ createdAt }: { createdAt: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-ink-muted">
      <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-ink-muted/70" />
      <span className="tabular-nums">{formatJoinedDate(createdAt)}</span>
    </div>
  );
}
