import type { ReactNode } from "react";
import type { SettlementKpiSummary } from "./settlementsDisplayUtils";
import { formatCurrency } from "../../../utils/currency";
import { transitionDefault } from "../../../theme/classNames";

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 13h.01M15 13h.01"
      />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-7M16 12h.01"
      />
    </svg>
  );
}

function PercentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M19 5L5 19M7 7a2 2 0 100-4 2 2 0 000 4zm10 14a2 2 0 100-4 2 2 0 000 4z"
      />
    </svg>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}

function BanknotesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

const tnumStyle = { fontFeatureSettings: '"tnum"' } as const;

function CompactKpiCard({
  title,
  value,
  icon,
  iconClassName,
  emphasizeValue,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  iconClassName: string;
  emphasizeValue?: boolean;
}) {
  return (
    <div
      className={`flex min-h-[88px] items-center overflow-visible rounded-[16px] border border-border/70 bg-white px-4 py-3.5 shadow-soft ${transitionDefault} hover:-translate-y-px hover:shadow-md`}
    >
      <div className="flex w-full items-center gap-3 overflow-visible">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          {icon}
        </span>
        <div className="flex min-w-0 flex-1 flex-col justify-center overflow-visible">
          <p className="text-xs font-medium leading-tight text-slate-500">{title}</p>
          <p
            className={`mt-0.5 whitespace-nowrap tabular-nums leading-none text-slate-900 ${
              emphasizeValue
                ? "text-[30px] font-semibold"
                : "text-2xl font-semibold"
            }`}
            style={tnumStyle}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

type SettlementsKpiCardsProps = {
  summary: SettlementKpiSummary | undefined;
  loading?: boolean;
};

export function SettlementsKpiCards({ summary, loading }: SettlementsKpiCardsProps) {
  const dash = loading ? "…" : "—";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <CompactKpiCard
        title="Subcontractors"
        value={summary ? summary.subcontractorCount.toLocaleString() : dash}
        icon={<BuildingIcon className="h-[18px] w-[18px]" />}
        iconClassName="bg-brand-mint text-brand"
        emphasizeValue
      />
      <CompactKpiCard
        title="Gross incl. tips"
        value={summary ? formatCurrency(summary.grossInclTips) : dash}
        icon={<WalletIcon className="h-[18px] w-[18px]" />}
        iconClassName="bg-emerald-100 text-emerald-700"
      />
      <CompactKpiCard
        title="Net driver payouts"
        value={summary ? formatCurrency(summary.netDriverPayouts) : dash}
        icon={<BanknotesIcon className="h-[18px] w-[18px]" />}
        iconClassName="bg-blue-100 text-blue-700"
      />
      <CompactKpiCard
        title="Total fees"
        value={summary ? formatCurrency(summary.totalFees) : dash}
        icon={<ReceiptIcon className="h-[18px] w-[18px]" />}
        iconClassName="bg-orange-100 text-orange-700"
      />
      <CompactKpiCard
        title="Total commission"
        value={summary ? formatCurrency(summary.totalCommission) : dash}
        icon={<PercentIcon className="h-[18px] w-[18px]" />}
        iconClassName="bg-indigo-100 text-indigo-700"
      />
      <CompactKpiCard
        title="Payable"
        value={summary ? formatCurrency(summary.payable) : dash}
        icon={<WalletIcon className="h-[18px] w-[18px]" />}
        iconClassName="bg-success/10 text-success"
      />
    </div>
  );
}
