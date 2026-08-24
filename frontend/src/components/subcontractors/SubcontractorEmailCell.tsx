import { useTranslation } from "react-i18next";
import type { Subcontractor } from "../../api/subcontractors";

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M4 4h16v16H4V4zm0 0l8 8 8-8"
      />
    </svg>
  );
}

export function SubcontractorEmailCell({ subcontractor }: { subcontractor: Subcontractor }) {
  const { t } = useTranslation();
  const email = subcontractor.email?.trim();

  if (email) {
    return (
      <div className="flex min-w-0 items-center gap-2 text-sm text-ink">
        <EmailIcon className="h-4 w-4 shrink-0 text-ink-muted/80" />
        <span className="truncate">{email}</span>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm text-ink-muted">
      <EmailIcon className="h-4 w-4 shrink-0 opacity-50" />
      <span className="truncate">{t("pages.subcontractorsList.noEmailAvailable")}</span>
    </div>
  );
}
