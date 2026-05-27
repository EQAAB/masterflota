import { useState } from "react";
import { transitionDefault } from "../../../theme/classNames";

function ChevronIcon({ className, expanded }: { className?: string; expanded: boolean }) {
  return (
    <svg
      className={`${className ?? ""} transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function SettlementsInfoCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-[18px] border border-brand-mint/60 bg-brand-mint/30 shadow-soft ${transitionDefault}`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <span className="text-sm font-medium text-ink">How settlements are calculated</span>
        <ChevronIcon className="h-4 w-4 shrink-0 text-ink-muted" expanded={expanded} />
      </button>
      {expanded && (
        <div className="border-t border-brand-mint/50 px-4 pb-4 pt-3">
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-muted">
            <li>Totals are summed from driver payouts for the selected period.</li>
            <li>
              <span className="font-medium text-ink">Payable</span> is the sum of net driver payouts for each
              subcontractor.
            </li>
            <li>
              <span className="font-medium text-ink">Gross incl. tips</span> already includes the tips shown in the
              next column — do not add those columns together.
            </li>
            <li>
              <span className="font-medium text-ink">Commission</span> is the sum of{" "}
              <span className="font-mono text-xs">company_commission</span> on each linked driver payout.
            </li>
            <li>Fee columns (vehicle rent, account fee, platform fee, daily cash, custom adjustments) mirror each deduction line on the driver payout.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
