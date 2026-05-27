import { Link } from "react-router-dom";
import { btnSecondary } from "../../../theme/classNames";
import { PageHeader } from "../../theme/PageHeader";

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 12h14m-6-6l6 6-6 6" />
    </svg>
  );
}

export function SettlementsPageHeader() {
  return (
    <div className="shrink-0 border-b border-border/60 bg-surface-card/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Subcontractor settlements"
          description="Review subcontractor totals for the selected period and mark settlements as paid."
          breadcrumbs={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Earnings", to: "/earnings" },
            { label: "Subcontractor settlements" },
          ]}
          className="border-0 bg-transparent px-0 py-4 sm:py-[1.125rem]"
          actions={
            <Link to="/earnings/payouts" className={`${btnSecondary} gap-2 whitespace-nowrap text-sm`}>
              Direct driver payouts
              <ArrowRightIcon className="h-4 w-4 shrink-0" />
            </Link>
          }
        />
      </div>
    </div>
  );
}
