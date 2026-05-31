import type { ReactNode } from "react";
import { btnSecondary, transitionDefault } from "../../../theme/classNames";
import { FilterChip } from "../../theme/FilterBar";

const filterCardClass = `rounded-2xl border border-border/70 bg-white p-4 shadow-soft sm:p-5 ${transitionDefault}`;
const filterLabelClass = "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500";
const controlH = "h-10 min-h-[40px]";
export const filterInputClass =
  `w-full ${controlH} rounded-xl border border-border/80 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none ` +
  "placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20";
export const filterSelectClass =
  `w-full ${controlH} rounded-xl border border-border/80 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none ` +
  "hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20";

type PayoutFiltersCardProps = {
  title?: string;
  hint?: string;
  children: ReactNode;
  footer?: ReactNode;
  activeChips?: { key: string; label: string; onRemove: () => void }[];
};

export function PayoutFiltersCard({
  title = "Filters",
  hint,
  children,
  footer,
  activeChips,
}: PayoutFiltersCardProps) {
  return (
    <section className={filterCardClass}>
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {hint && <p className="mt-0.5 max-w-xl text-xs text-ink-muted">{hint}</p>}
        </div>
      </div>
      {children}
      {footer && <div className="mt-3.5 border-t border-border/60 pt-3">{footer}</div>}
      {activeChips && activeChips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Active</span>
          {activeChips.map((chip) => (
            <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
          ))}
        </div>
      )}
    </section>
  );
}

export function PayoutFilterField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={filterLabelClass}>{label}</label>
      {children}
    </div>
  );
}

export { btnSecondary as payoutFilterBtnSecondary };
