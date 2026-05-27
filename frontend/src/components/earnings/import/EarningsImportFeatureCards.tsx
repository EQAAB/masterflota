import { kpiCard, transitionDefault } from "../../../theme/classNames";

const FEATURES = [
  {
    title: "Accurate tracking",
    description: "Keep earnings data accurate and up to date",
    iconClass: "bg-success/10 text-success",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Faster processing",
    description: "Bulk import saves time and reduces manual entry",
    iconClass: "bg-purple-100 text-purple-700",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Data validation",
    description: "Automatic validation reduces errors",
    iconClass: "bg-warning/10 text-warning",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Better insights",
    description: "Complete data for better reporting",
    iconClass: "bg-blue-100 text-blue-700",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
  },
] as const;

export function EarningsImportFeatureCards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {FEATURES.map((f) => (
        <div
          key={f.title}
          className={`${kpiCard} min-h-0 !p-4 ${transitionDefault} hover:-translate-y-px hover:shadow-card-hover`}
        >
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${f.iconClass}`}>
            {f.icon}
          </div>
          <h3 className="mt-3 text-sm font-semibold text-ink">{f.title}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{f.description}</p>
        </div>
      ))}
    </div>
  );
}
