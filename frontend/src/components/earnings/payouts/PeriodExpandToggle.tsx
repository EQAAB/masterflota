import { ChevronDownIcon } from "../../theme/actionMenuIcons";
import { transitionDefault } from "../../../theme/classNames";

type PeriodExpandToggleProps = {
  expanded: boolean;
  onToggle: () => void;
  className?: string;
};

export function PeriodExpandToggle({ expanded, onToggle, className = "" }: PeriodExpandToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={expanded ? "Hide payout breakdown" : "Show payout breakdown"}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-white hover:bg-surface ${transitionDefault} ${className}`}
    >
      <ChevronDownIcon
        className={`w-3.5 h-3.5 text-ink-muted ${expanded ? "rotate-180" : ""} ${transitionDefault}`}
      />
    </button>
  );
}
