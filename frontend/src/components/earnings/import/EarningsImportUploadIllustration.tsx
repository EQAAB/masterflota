type EarningsImportUploadIllustrationProps = {
  active?: boolean;
  processing?: boolean;
  error?: boolean;
};

export function EarningsImportUploadIllustration({
  active = false,
  processing = false,
  error = false,
}: EarningsImportUploadIllustrationProps) {
  return (
    <div
      className={`relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16 ${processing ? "animate-pulse" : ""}`}
      aria-hidden
    >
      <div
        className={`absolute inset-0 rounded-full transition-transform duration-300 ${error ? "bg-red-100/80" : "bg-brand/10"} ${active ? "scale-110" : "scale-100"}`}
      />

      <div
        className={`relative flex h-12 w-12 items-center justify-center rounded-full ring-1 sm:h-14 sm:w-14 ${transitionRing(error, active)} ${active ? "-translate-y-0.5 shadow-soft" : ""}`}
      >
        {error ? (
          <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        ) : (
          <svg
            className={`h-6 w-6 text-brand sm:h-7 sm:w-7 ${active ? "-translate-y-0.5" : ""} ${processing ? "animate-bounce" : ""} transition-transform duration-300`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

function transitionRing(error: boolean, active: boolean): string {
  if (error) return "bg-gradient-to-br from-red-50 to-white ring-red-200/70";
  if (active) return "bg-gradient-to-br from-brand-mint/90 to-brand-mint/40 ring-brand/25";
  return "bg-gradient-to-br from-brand-mint/70 to-brand-mint/30 ring-brand/15";
}
