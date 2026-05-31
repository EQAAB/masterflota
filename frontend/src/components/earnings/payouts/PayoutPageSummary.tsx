import type { ReactNode } from "react";
import { formatCurrency } from "../../../utils/currency";
import { transitionDefault } from "../../../theme/classNames";

const tnumStyle = { fontFeatureSettings: '"tnum"' } as const;

type SummaryTone = "neutral" | "pending" | "paid" | "amount";

const toneStyles: Record<SummaryTone, { card: string; icon: string; label: string; value: string }> = {
  neutral: {
    card: "border-border/70 bg-white shadow-soft hover:border-slate-200",
    icon: "bg-brand-mint/80 text-brand",
    label: "text-slate-500",
    value: "text-slate-900",
  },
  pending: {
    card:
      "border-amber-200/90 bg-gradient-to-br from-amber-50/95 to-orange-50/50 shadow-[0_2px_16px_rgba(245,158,11,0.1)] hover:border-amber-300/90",
    icon: "bg-amber-100 text-amber-700 ring-1 ring-amber-200/60",
    label: "text-amber-800/90",
    value: "text-amber-950",
  },
  paid: {
    card:
      "border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 to-teal-50/40 shadow-[0_2px_16px_rgba(34,197,94,0.1)] hover:border-emerald-300/90",
    icon: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/60",
    label: "text-emerald-800/90",
    value: "text-emerald-950",
  },
  amount: {
    card:
      "border-slate-200/90 bg-gradient-to-br from-slate-50/95 to-white shadow-[0_2px_16px_rgba(15,23,42,0.06)] hover:border-slate-300/90",
    icon: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/60",
    label: "text-slate-600",
    value: "text-slate-900",
  },
};

function SummaryCard({
  title,
  value,
  icon,
  tone = "neutral",
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone?: SummaryTone;
}) {
  const s = toneStyles[tone];
  return (
    <div
      className={`flex min-h-[60px] items-center rounded-xl border px-3 py-2 ${transitionDefault} hover:-translate-y-px ${s.card}`}
    >
      <div className="flex w-full items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.icon}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-semibold uppercase tracking-wider leading-none ${s.label}`}>
            {title}
          </p>
          <p
            className={`mt-1 text-[1.35rem] font-bold tabular-nums leading-none sm:text-2xl ${s.value}`}
            style={tnumStyle}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export type PayoutPageSummaryProps = {
  driverCount: number;
  pendingCount: number;
  paidCount: number;
  totalAmount: number;
  loading?: boolean;
};

export function PayoutPageSummary({
  driverCount,
  pendingCount,
  paidCount,
  totalAmount,
  loading,
}: PayoutPageSummaryProps) {
  const dash = loading ? "…" : "—";

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      <SummaryCard
        title="Total drivers"
        value={loading ? dash : driverCount.toLocaleString()}
        tone="neutral"
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        }
      />
      <SummaryCard
        title="Pending payouts"
        value={loading ? dash : pendingCount.toLocaleString()}
        tone="pending"
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />
      <SummaryCard
        title="Paid payouts"
        value={loading ? dash : paidCount.toLocaleString()}
        tone="paid"
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />
      <SummaryCard
        title="Total payout amount"
        value={loading ? dash : formatCurrency(totalAmount)}
        tone="amount"
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        }
      />
    </div>
  );
}
