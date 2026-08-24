import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCanManageRentals } from "../../../lib/rentalsPermissions";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";

type BookingsPageHeaderProps = {
  onQuickWeekly?: () => void;
};

export function BookingsPageHeader({ onQuickWeekly }: BookingsPageHeaderProps) {
  const { t } = useTranslation();
  const canManage = useCanManageRentals();
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Link
          to="/rentals"
          className={`${btnSecondary} !mb-3 !inline-flex !min-h-0 !px-3 !py-1.5 !text-xs`}
        >
          ← {t("pages.bookings.backToDashboard")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">
          {t("pages.bookings.title")}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
          {t("pages.bookings.subtitle")}
        </p>
      </div>
      {canManage && (
        <div className="flex shrink-0 flex-wrap gap-2">
          {onQuickWeekly && (
            <button type="button" className={btnPrimary} onClick={onQuickWeekly}>
              {t("pages.bookings.quickWeekly")}
            </button>
          )}
        </div>
      )}
    </header>
  );
}
