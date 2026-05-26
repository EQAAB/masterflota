export function EarningsImportUploadIllustration() {
  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center" aria-hidden>
      <div className="absolute -left-1 top-1 h-1.5 w-1.5 rounded-full bg-brand/25" />
      <div className="absolute right-0 top-3 h-1 w-1 rounded-full bg-brand/30" />
      <div className="absolute bottom-2 left-1 h-1 w-1 rounded-full bg-brand/20" />
      <div className="absolute bottom-4 right-2 h-1.5 w-1.5 rounded-full bg-brand/15" />

      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-mint/40">
        <svg className="h-9 w-9 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>
    </div>
  );
}
