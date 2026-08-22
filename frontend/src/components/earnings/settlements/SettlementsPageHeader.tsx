import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { transitionDefault } from "../../../theme/classNames";
import { PageHeader } from "../../theme/PageHeader";

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 12h14m-6-6l6 6-6 6" />
    </svg>
  );
}

const payoutsLinkClass =
  `inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border/80 bg-white px-4 ` +
  `text-sm font-medium text-slate-800 shadow-sm ${transitionDefault} ` +
  `hover:border-slate-300 hover:bg-slate-50 hover:shadow-md`;

export function SettlementsPageHeader() {
  const { t } = useTranslation();
  return (
    <div className="shrink-0 border-b border-border/60 bg-surface-card/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          title={t("pages.subSettlements.title")}
          description={t("pages.subSettlements.subtitle")}
          breadcrumbs={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Earnings", to: "/earnings" },
            { label: t("pages.subSettlements.title") },
          ]}
          className="border-0 bg-transparent px-0 py-4 sm:py-5 [&_nav]:mb-1.5 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:tracking-tight [&_h1]:text-slate-900 [&_.text-sm.text-ink-muted]:mt-1.5 [&_.text-sm.text-ink-muted]:max-w-2xl [&_.text-sm.text-ink-muted]:text-sm [&_.text-sm.text-ink-muted]:font-normal [&_.text-sm.text-ink-muted]:leading-relaxed [&_.text-sm.text-ink-muted]:text-slate-500"
          actions={
            <Link to="/earnings/payouts" className={payoutsLinkClass}>
              <span>Direct driver payouts</span>
              <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-500" />
            </Link>
          }
        />
      </div>
    </div>
  );
}
