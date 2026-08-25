import { useTranslation } from "react-i18next";

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
      />
    </svg>
  );
}

export function ImportWhatsNextBanner() {
  const { t } = useTranslation();
  const STEPS = [
    t("pages.earningsImport.validateFileAgainstTemplateStep"),
    t("pages.earningsImport.matchDriversCalculateStep"),
    t("pages.earningsImport.trackStatusInTableStep"),
  ];
  return (
    <div className="border-t border-border/30 bg-gradient-to-r from-brand-mint/20 via-brand-mint/8 to-white px-4 py-3 sm:px-5">
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/90 text-brand ring-1 ring-brand/10">
          <SparklesIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] font-semibold tracking-tight text-ink">{t("pages.earningsImport.whatHappensNextTitle")}</h4>
          <ul className="mt-1.5 space-y-1">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-2 text-[11px] leading-snug text-slate-600">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[9px] font-semibold text-brand-dark">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function UploadIllustration() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-mint/50 ring-1 ring-brand/15">
      <svg className="h-7 w-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    </div>
  );
}

export function ImportEmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <UploadIllustration />
      <h3 className="mt-4 text-sm font-semibold text-ink">{t("pages.earningsImport.noImportsYetTitle")}</h3>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-muted">
        {t("pages.earningsImport.uploadFirstExportDesc")}
      </p>
    </div>
  );
}

export function ImportFailedEmptyHint() {
  const { t } = useTranslation();
  return (
    <div className="mx-4 mb-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5">
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <p className="text-xs leading-relaxed text-red-800">
        {t("pages.earningsImport.failedImportsStayHint")}
      </p>
    </div>
  );
}
