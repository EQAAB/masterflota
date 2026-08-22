import type { ReactNode } from "react";
import type { SubcontractorSettlementDetail } from "../../../../api/subcontractorPayouts";
import { formatCurrency } from "../../../../utils/currency";
import { transitionDefault } from "../../../../theme/classNames";
import { moneyAccentClass } from "./settlementDetailDisplayUtils";

const tnumStyle = { fontFeatureSettings: '"tnum"' } as const;

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
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

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9m9 9v3.75M6.75 12h4.875m-4.875 0a3 3 0 110-6h4.875m0 6V9.375c0-.621.504-1.125 1.125-1.125h2.25"
      />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
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

function MinusCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ArrowPathIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  );
}

function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function DetailKpiCard({
  title,
  value,
  numericAmount,
  icon,
  iconClassName,
  accentNegative,
  emphasize,
}: {
  title: string;
  value: string;
  numericAmount?: number;
  icon: ReactNode;
  iconClassName: string;
  accentNegative?: boolean;
  emphasize?: boolean;
}) {
  const valueColor =
    numericAmount != null && accentNegative
      ? moneyAccentClass(numericAmount, true)
      : "text-slate-900";

  return (
    <div
      className={`flex min-h-[80px] items-center rounded-[16px] border border-border/70 bg-white px-3.5 py-3 shadow-soft ${transitionDefault} hover:-translate-y-px hover:shadow-md`}
    >
      <div className="flex w-full items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium leading-tight text-slate-500">{title}</p>
          <p
            className={`mt-0.5 whitespace-nowrap tabular-nums leading-none ${valueColor} ${
              emphasize ? "text-xl font-semibold" : "text-lg font-semibold"
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

type SettlementDetailKpiCardsProps = {
  totals: SubcontractorSettlementDetail["totals"];
};

export function SettlementDetailKpiCards({ totals }: SettlementDetailKpiCardsProps) {
  const dailyCash = Number(totals.daily_cash);
  const customDed = Number(totals.custom_deductions);
  const debtApplied = Number(totals.debt_applied);

  const cards = [
    {
      title: "Drivers",
      value: String(totals.drivers),
      icon: <UsersIcon className="h-[17px] w-[17px]" />,
      iconClassName: "bg-brand-mint text-brand",
      emphasize: true,
    },
    {
      title: "Gross incl. tips",
      value: formatCurrency(Number(totals.gross_incl_tips)),
      icon: <WalletIcon className="h-[17px] w-[17px]" />,
      iconClassName: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Tips",
      value: formatCurrency(Number(totals.tips)),
      icon: <CoinIcon className="h-[17px] w-[17px]" />,
      iconClassName: "bg-sky-100 text-sky-700",
    },
    {
      title: "Commission",
      value: formatCurrency(Number(totals.commission)),
      icon: <PercentIcon className="h-[17px] w-[17px]" />,
      iconClassName: "bg-indigo-100 text-indigo-700",
    },
    {
      title: "Vehicle rent",
      value: formatCurrency(Number(totals.vehicle_rent)),
      icon: <TruckIcon className="h-[17px] w-[17px]" />,
      iconClassName: "bg-orange-100 text-orange-700",
    },
    {
      title: "Acct. fee",
      value: formatCurrency(Number(totals.account_opening_fee)),
      icon: <DocumentIcon className="h-[17px] w-[17px]" />,
      iconClassName: "bg-violet-100 text-violet-700",
    },
    {
      title: "Platform fee",
      value: formatCurrency(Number(totals.platform_fees)),
      icon: <ReceiptIcon className="h-[17px] w-[17px]" />,
      iconClassName: "bg-slate-100 text-slate-600",
    },
    {
      title: "Daily cash",
      value: formatCurrency(dailyCash),
      numericAmount: dailyCash,
      icon: <BanknotesIcon className="h-[17px] w-[17px]" />,
      iconClassName: "bg-rose-50 text-rose-600/90",
      accentNegative: true,
    },
    {
      title: "Custom deductions",
      value: formatCurrency(customDed),
      numericAmount: customDed,
      icon: <MinusCircleIcon className="h-[17px] w-[17px]" />,
      iconClassName: "bg-red-50 text-red-600/80",
      accentNegative: true,
    },
    {
      title: "Custom additions",
      value: formatCurrency(Number(totals.custom_additions)),
      icon: <PlusCircleIcon className="h-[17px] w-[17px]" />,
      iconClassName: "bg-teal-50 text-teal-700",
    },
    {
      title: "Raw net",
      value: formatCurrency(Number(totals.raw_net)),
      icon: <WalletIcon className="h-[17px] w-[17px]" />,
      iconClassName: "bg-slate-100 text-slate-700",
    },
    {
      title: "Debt applied",
      value: formatCurrency(debtApplied),
      numericAmount: debtApplied,
      icon: <ArrowPathIcon className="h-[17px] w-[17px]" />,
      iconClassName: "bg-amber-50 text-amber-700",
      accentNegative: true,
    },
    {
      title: "Payable",
      value: formatCurrency(Number(totals.payable)),
      icon: <WalletIcon className="h-[17px] w-[17px]" />,
      iconClassName: "bg-success/10 text-success",
      emphasize: true,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((c) => (
        <DetailKpiCard
          key={c.title}
          title={c.title}
          value={c.value}
          numericAmount={"numericAmount" in c ? c.numericAmount : undefined}
          icon={c.icon}
          iconClassName={c.iconClassName}
          accentNegative={"accentNegative" in c ? c.accentNegative : false}
          emphasize={"emphasize" in c ? c.emphasize : false}
        />
      ))}
    </div>
  );
}
