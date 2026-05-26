import { card, sectionLabel } from "../../theme/classNames";

type FilterBarProps = {
  title?: string;
  helper?: string;
  children: React.ReactNode;
  chips?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function FilterBar({ title, helper, children, chips, footer, className = "" }: FilterBarProps) {
  return (
    <section className={`${card} space-y-4 ${className}`}>
      {(title || helper) && (
        <div>
          {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
          {helper && <p className="text-xs text-ink-muted mt-0.5">{helper}</p>}
        </div>
      )}
      {children}
      {footer}
      {chips && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">{chips}</div>
      )}
    </section>
  );
}

export function FilterField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={sectionLabel}>{label}</label>
      {children}
    </div>
  );
}

export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-xs text-ink">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 text-ink-muted hover:bg-surface hover:text-ink"
        aria-label={`Remove filter ${label}`}
      >
        ×
      </button>
    </span>
  );
}
