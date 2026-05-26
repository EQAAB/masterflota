import { btnSecondary, pageSubtitle, pageTitle } from "../../../theme/classNames";
import { scrollToRecentImports } from "./importDisplayUtils";

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function EarningsImportHeader() {
  return (
    <div className="shrink-0 border-b border-border/60 bg-surface-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-start justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8 sm:py-6">
        <div className="min-w-0">
          <h1 className={pageTitle}>Import earnings</h1>
          <p className={pageSubtitle}>Upload your earnings files to keep data accurate and up to date.</p>
        </div>
        <button
          type="button"
          onClick={scrollToRecentImports}
          className={`${btnSecondary} gap-2 text-sm`}
        >
          <HistoryIcon className="h-4 w-4 text-ink-muted" />
          Import history
        </button>
      </div>
    </div>
  );
}
