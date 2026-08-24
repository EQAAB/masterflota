import { useTranslation } from "react-i18next";
import { btnPrimary } from "../../../theme/classNames";

type PaymentsEmptyStateProps = {
  canManage?: boolean;
  onRecord: () => void;
};

export function PaymentsEmptyState({ canManage = false, onRecord }: PaymentsEmptyStateProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-ink">{t("pages.payments.emptyTitle")}</h2>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        {t("pages.payments.emptyDescription")}
      </p>
      {canManage ? (
        <button type="button" className={`${btnPrimary} mt-6`} onClick={onRecord}>
          {t("pages.payments.recordPayment")}
        </button>
      ) : null}
    </div>
  );
}
