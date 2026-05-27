import { formatCurrency } from "../../../../utils/currency";
import type { SubcontractorSettlementDetail } from "../../../../api/subcontractorPayouts";

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ExclamationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

type SettlementDetailIntegrityBannerProps = {
  integrityOk: boolean;
  validation: SubcontractorSettlementDetail["validation"];
};

export function SettlementDetailIntegrityBanner({
  integrityOk,
  validation,
}: SettlementDetailIntegrityBannerProps) {
  if (integrityOk) {
    return (
      <div
        className="flex items-start gap-3 rounded-[14px] border border-brand-mint/55 bg-brand-mint/20 px-3.5 py-2.5 text-sm text-slate-800 shadow-soft ring-1 ring-inset ring-white/50"
        role="status"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <CheckCircleIcon className="h-[18px] w-[18px]" />
        </span>
        <p className="pt-0.5 font-medium leading-snug text-slate-800">
          Data integrity: driver breakdown matches settlement totals.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-3 rounded-[14px] border border-red-200/80 bg-red-50/90 px-3.5 py-2.5 text-sm text-red-900 shadow-sm"
      role="alert"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
        <ExclamationIcon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 pt-0.5 font-medium leading-snug">
        <p>Data integrity error: driver totals do not match the settlement.</p>
        {validation.matched === false && (
          <p className="mt-1 text-xs font-normal text-red-800/90">
            Net sum difference: {formatCurrency(validation.difference)} (expected 0).
          </p>
        )}
        {validation.totals_matched === false && (
          <p className="mt-1 text-xs font-normal text-red-800/90">
            Column totals difference (max): {formatCurrency(validation.totals_difference)}.
          </p>
        )}
      </div>
    </div>
  );
}
