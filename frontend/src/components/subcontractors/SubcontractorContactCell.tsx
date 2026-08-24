import { useTranslation } from "react-i18next";
import type { Subcontractor } from "../../api/subcontractors";

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
      />
    </svg>
  );
}

export function SubcontractorContactCell({ subcontractor }: { subcontractor: Subcontractor }) {
  const { t } = useTranslation();
  const phone = subcontractor.phone?.trim();

  if (phone) {
    return (
      <div className="flex min-w-0 items-center gap-2 text-sm text-ink">
        <PhoneIcon className="h-4 w-4 shrink-0 text-ink-muted/80" />
        <span className="truncate tabular-nums">{phone}</span>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm text-ink-muted">
      <PhoneIcon className="h-4 w-4 shrink-0 opacity-50" />
      <span className="truncate">{t("pages.subcontractorsList.noPhoneAvailable")}</span>
    </div>
  );
}
