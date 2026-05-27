import { useState } from "react";
import { transitionDefault } from "../../../theme/classNames";

function ChevronIcon({ className, expanded }: { className?: string; expanded: boolean }) {
  return (
    <svg
      className={`${className ?? ""} transition-transform duration-200 ease-out ${expanded ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function SettlementsInfoCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-[18px] border border-brand-mint/50 bg-gradient-to-r from-brand-mint/40 to-brand-mint/20 shadow-soft ${transitionDefault}`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-brand-mint/30 sm:px-5"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-brand shadow-sm">
            <InfoIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-ink">How settlements are calculated</span>
        </span>
        <ChevronIcon className="h-4 w-4 shrink-0 text-ink-muted" expanded={expanded} />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-brand-mint/40 px-4 pb-4 pt-3 sm:px-5">
            <ul className="space-y-2.5 text-sm leading-relaxed text-ink-muted">
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
                <span>Totals are summed from driver payouts for the selected period.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
                <span>
                  <span className="font-medium text-ink">Payable</span> is the sum of net driver payouts for each
                  subcontractor.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
                <span>
                  <span className="font-medium text-ink">Gross incl. tips</span> already includes tips — do not add
                  those columns together.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
                <span>
                  <span className="font-medium text-ink">Commission</span> is the sum of{" "}
                  <span className="font-mono text-xs">company_commission</span> on each linked driver payout.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
                <span>
                  Fee columns (vehicle rent, account fee, platform fee, daily cash, custom adjustments) mirror each
                  deduction line on the driver payout — expand a row to view them.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
