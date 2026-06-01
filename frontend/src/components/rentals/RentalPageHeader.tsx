import { Link } from "react-router-dom";
import { btnPrimary, btnSecondary } from "../../theme/classNames";

type RentalPageHeaderProps = {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  actionTo?: string;
  actionLabel?: string;
};

export function RentalPageHeader({
  title,
  subtitle,
  backTo,
  backLabel = "Back",
  actionTo,
  actionLabel,
}: RentalPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {backTo && (
          <Link to={backTo} className={`${btnSecondary} !mb-3 !min-h-0 !py-1.5 !px-3 !text-xs inline-flex`}>
            ← {backLabel}
          </Link>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actionTo && actionLabel && (
        <Link to={actionTo} className={`${btnPrimary} shrink-0 !text-sm`}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
