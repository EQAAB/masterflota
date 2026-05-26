import { input } from "../../../theme/classNames";

const GLOVO_COMMISSION_BASE_OPTIONS = [
  { value: "net_income", label: "Net income (after platform fee / Taxa)" },
  { value: "gross_income", label: "Gross income (Venituri + Tips)" },
  { value: "net_income_no_tips", label: "Net without tips" },
  { value: "gross_income_no_tips", label: "Gross without tips" },
  { value: "net_income_no_bonuses", label: "Net (no bonuses column yet)" },
  { value: "gross_income_no_bonuses", label: "Gross (no bonuses column yet)" },
] as const;

type EarningsImportGlovoSettingsProps = {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  isAdmin: boolean;
};

export function EarningsImportGlovoSettings({
  value,
  onChange,
  disabled,
  isAdmin,
}: EarningsImportGlovoSettingsProps) {
  return (
    <div className="rounded-[20px] border border-warning/20 bg-warning/5 px-5 py-4 shadow-soft sm:px-6">
      <p className="text-sm font-semibold text-ink">Glovo: fleet commission base</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">
        Chooses the amount we multiply by each driver&apos;s commission rules. Driver payout is still net income
        minus commission minus daily cash.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="glovo-commission-base" className="sr-only">
          Commission base type
        </label>
        <select
          id="glovo-commission-base"
          className={`${input} max-w-md text-sm`}
          value={value}
          disabled={disabled || !isAdmin}
          onChange={(e) => onChange(e.target.value)}
        >
          {GLOVO_COMMISSION_BASE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {!isAdmin && (
          <span className="text-xs text-ink-muted">Only admins can change this setting.</span>
        )}
      </div>
    </div>
  );
}
