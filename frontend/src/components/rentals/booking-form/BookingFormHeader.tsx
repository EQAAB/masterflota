import { Link } from "react-router-dom";
import { btnSecondary } from "../../../theme/classNames";

type BookingFormHeaderProps = {
  title: string;
  subtitle: string;
  backTo: string;
  backLabel: string;
  statusBadge?: string;
  onSaveDraft?: () => void;
  saveDraftPending?: boolean;
  saveDraftDisabled?: boolean;
};

export function BookingFormHeader({
  title,
  subtitle,
  backTo,
  backLabel,
  statusBadge,
  onSaveDraft,
  saveDraftPending,
  saveDraftDisabled,
}: BookingFormHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <Link to={backTo} className="fm-rental-booking-form__back mb-3 inline-flex">
          <span aria-hidden>←</span> {backLabel}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">{title}</h1>
          {statusBadge && (
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200/80">
              {statusBadge}
            </span>
          )}
        </div>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">{subtitle}</p>
      </div>
      {onSaveDraft && (
        <button
          type="button"
          className={`${btnSecondary} shrink-0`}
          onClick={onSaveDraft}
          disabled={saveDraftDisabled || saveDraftPending}
        >
          {saveDraftPending ? "Saving…" : "Save draft"}
        </button>
      )}
    </header>
  );
}
