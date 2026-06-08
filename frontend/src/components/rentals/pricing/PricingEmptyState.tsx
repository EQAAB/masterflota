import { btnPrimary } from "../../../theme/classNames";

type PricingEmptyStateProps = {
  canManage?: boolean;
  onAdd: () => void;
};

export function PricingEmptyState({ canManage = true, onAdd }: PricingEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-ink">No pricing configured</h2>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        Add pricing rules to start managing rental rates, deposits, and seasonal plans.
      </p>
      {canManage ? (
        <button type="button" className={`${btnPrimary} mt-6`} onClick={onAdd}>
          Add pricing rule
        </button>
      ) : null}
    </div>
  );
}
