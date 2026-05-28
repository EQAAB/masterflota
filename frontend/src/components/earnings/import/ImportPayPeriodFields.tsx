import type { PaymentWeekValidation } from "../../../utils/earningsImportWeek";
import { btnSecondary, input, sectionLabel } from "../../../theme/classNames";

type ImportPayPeriodFieldsProps = {
  periodStart: string;
  periodEnd: string;
  onPeriodStartChange: (value: string) => void;
  onPeriodEndChange: (value: string) => void;
  onResetPreviousWeek: () => void;
  validation: PaymentWeekValidation;
  busy?: boolean;
  /** Modal uses compact labels without sectionLabel utility in some places */
  variant?: "card" | "modal";
};

export function ImportPayPeriodFields({
  periodStart,
  periodEnd,
  onPeriodStartChange,
  onPeriodEndChange,
  onResetPreviousWeek,
  validation,
  busy = false,
  variant = "card",
}: ImportPayPeriodFieldsProps) {
  const labelClass =
    variant === "modal" ? "mb-1 block text-xs font-medium text-ink" : sectionLabel;
  const inputClass =
    variant === "modal"
      ? "w-full rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50"
      : input;

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[10rem] flex-1">
          <span className={labelClass}>Period start</span>
          <input
            type="date"
            className={inputClass}
            value={periodStart}
            disabled={busy}
            onChange={(e) => onPeriodStartChange(e.target.value)}
            aria-invalid={validation.errors.length > 0}
          />
        </label>
        <label className="min-w-[10rem] flex-1">
          <span className={labelClass}>Period end</span>
          <input
            type="date"
            className={inputClass}
            value={periodEnd}
            disabled={busy}
            onChange={(e) => onPeriodEndChange(e.target.value)}
            aria-invalid={validation.errors.length > 0}
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={onResetPreviousWeek}
          className={`${btnSecondary} shrink-0 text-sm`}
        >
          Reset to Previous Week
        </button>
      </div>

      {validation.errors.length > 0 && (
        <ul className="list-inside list-disc space-y-0.5 text-xs text-danger" role="alert">
          {validation.errors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}
      {validation.warnings.length > 0 && (
        <ul className="list-inside list-disc space-y-0.5 text-xs text-warning">
          {validation.warnings.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
