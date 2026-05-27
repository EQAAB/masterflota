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

function CompactKpiCard({
  title,
  value,
  icon,
  iconClassName,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <div
      className={`flex h-full min-h-[76px] flex-col justify-between rounded-[14px] border border-border/80 bg-white p-3.5 shadow-soft ${transitionDefault} hover:shadow-soft-lg`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[11px] font-medium leading-tight text-ink-muted">{title}</p>
          <p className="mt-1 truncate text-[15px] font-bold tabular-nums leading-none text-ink whitespace-nowrap">
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <CompactKpiCard
        title="Subcontractors"
        value={summary ? summary.subcontractorCount.toLocaleString() : dash}
        icon={<BuildingIcon className="h-4 w-4" />}
        iconClassName="bg-brand-mint text-brand"
      />
      <CompactKpiCard
        title="Gross incl. tips"
        value={summary ? formatCurrency(summary.grossInclTips) : dash}
        icon={<WalletIcon className="h-4 w-4" />}
        iconClassName="bg-emerald-100 text-emerald-700"
      />
      <CompactKpiCard
        title="Net driver payouts"
        value={summary ? formatCurrency(summary.netDriverPayouts) : dash}
        icon={<BanknotesIcon className="h-4 w-4" />}
        iconClassName="bg-blue-100 text-blue-700"
      />
      <CompactKpiCard
        title="Total fees"
        value={summary ? formatCurrency(summary.totalFees) : dash}
        icon={<ReceiptIcon className="h-4 w-4" />}
        iconClassName="bg-orange-100 text-orange-700"
      />
      <CompactKpiCard
        title="Total commission"
        value={summary ? formatCurrency(summary.totalCommission) : dash}
        icon={<PercentIcon className="h-4 w-4" />}
        iconClassName="bg-indigo-100 text-indigo-700"
      />
      <CompactKpiCard
        title="Payable"
        value={summary ? formatCurrency(summary.payable) : dash}
        icon={<WalletIcon className="h-4 w-4" />}
        iconClassName="bg-success/10 text-success"
      />
    </div>
  );
}
