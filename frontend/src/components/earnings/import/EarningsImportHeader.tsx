import { pageSubtitle, pageTitle, transitionDefault } from "../../../theme/classNames";
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

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}

export function EarningsImportHeader() {
  return (
    <div className="shrink-0 border-b border-border/50 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex min-w-0 items-start gap-3.5">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-mint/60 ring-1 ring-brand/15 sm:flex">
            <UploadIcon className="h-5 w-5 text-brand-dark" />
          </div>
          <div className="min-w-0">
            <h1 className={`${pageTitle} leading-tight`}>Import earnings</h1>
            <p className={`${pageSubtitle} mt-1 max-w-2xl`}>
              Upload platform exports to keep driver payouts accurate and up to date.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={scrollToRecentImports}
            className={`inline-flex h-10 items-center gap-2 rounded-xl border border-border/80 bg-white px-4 text-sm font-medium text-ink shadow-sm ${transitionDefault} hover:border-brand/25 hover:bg-brand-mint/20 hover:shadow-md`}
          >
            <HistoryIcon className="h-4 w-4 text-ink-muted" />
            Import history
          </button>
        </div>
      </div>
    </div>
  );
}
