import { Link } from "react-router-dom";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";

type PricingPageHeaderProps = {
  canManage?: boolean;
  onAdd: () => void;
  onExport: () => void;
};

export function PricingPageHeader({ canManage = true, onAdd, onExport }: PricingPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Link
          to="/rentals"
          className={`${btnSecondary} !mb-3 !inline-flex !min-h-0 !px-3 !py-1.5 !text-xs`}
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">Pricing</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Manage rental pricing, deposits, and rate plans for all vehicles.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btnSecondary} onClick={onExport}>
          Export
        </button>
        {canManage && (
          <button type="button" className={`${btnPrimary} fm-rental-pricing__header-cta`} onClick={onAdd}>
            Add pricing rule
          </button>
        )}
      </div>
    </header>
  );
}
