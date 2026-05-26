import { btnGhost, transitionDefault } from "../../../theme/classNames";
import { scrollToRecentImports } from "./importDisplayUtils";

function InfoIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 12h14m-7-7l7 7-7 7" />
    </svg>
  );
}

export function ImportWhatsNextBanner() {
  return (
    <div className="flex flex-col gap-4 border-t border-border/60 bg-gradient-to-r from-brand-mint/30 to-brand-mint/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
      <div className="flex min-w-0 items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <InfoIcon />
        </span>
        <div>
          <h4 className="text-sm font-semibold text-ink">What happens next?</h4>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-muted">
            We&apos;ll validate your file and process the data. You&apos;ll be notified once the import is complete.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={scrollToRecentImports}
        className={`${btnGhost} shrink-0 gap-2 border border-brand/20 bg-white/70 px-4 py-2.5 text-sm font-medium text-brand hover:bg-white ${transitionDefault}`}
      >
        View import history
        <ArrowIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
