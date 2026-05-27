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
      className={`overflow-hidden rounded-[16px] border border-brand-mint/55 bg-brand-mint/20 shadow-soft ring-1 ring-inset ring-white/50 ${transitionDefault}`}
    >
      <button
        type="button"
        className="flex h-12 w-full items-center justify-between gap-3 px-4 text-left transition-colors duration-150 hover:bg-brand-mint/30 sm:px-4"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/90 text-brand shadow-sm ring-1 ring-brand-mint/60">
            <InfoIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium text-slate-800">How settlements are calculated</span>
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center">
          <ChevronIcon className="h-4 w-4 text-slate-500" expanded={expanded} />
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-brand-mint/40 px-4 pb-3 pt-2.5 sm:px-4">
            <ul className="space-y-1.5 text-sm leading-relaxed text-slate-600">
              <li>Totals are summed from driver payouts for the selected period.</li>
              <li>
                <span className="font-medium text-slate-800">Payable</span> is the sum of net driver payouts for each
                subcontractor.
              </li>
              <li>
                <span className="font-medium text-slate-800">Gross incl. tips</span> already includes tips — do not add
                those columns together.
              </li>
              <li>
                <span className="font-medium text-slate-800">Commission</span> is the sum of{" "}
                <span className="font-mono text-xs">company_commission</span> on each linked driver payout.
              </li>
              <li>Fee columns mirror driver payout deductions — expand a row for details.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
