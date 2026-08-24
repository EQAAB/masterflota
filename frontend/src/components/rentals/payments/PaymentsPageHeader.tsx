import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";

type PaymentsPageHeaderProps = {
  canManage?: boolean;
  onRecord: () => void;
  onExport: () => void;
};

export function PaymentsPageHeader({ canManage = false, onRecord, onExport }: PaymentsPageHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Link
          to="/rentals"
          className={`${btnSecondary} !mb-3 !inline-flex !min-h-0 !px-3 !py-1.5 !text-xs`}
        >
          ← {t("common.back")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">
          {t("pages.payments.title")}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
          {t("pages.payments.subtitle")}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btnSecondary} onClick={onExport}>
          {t("common.export")}
        </button>
        {canManage && (
          <button type="button" className={`${btnPrimary} fm-rental-payments__header-cta`} onClick={onRecord}>
            {t("pages.payments.add")}
          </button>
        )}
      </div>
    </header>
  );
}
