import { kpiCard, chartCard } from "../../../theme/classNames";

export function EarningsOverviewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${kpiCard} animate-pulse`}>
            <div className="h-3 w-24 rounded bg-border" />
            <div className="mt-4 h-8 w-40 rounded bg-border" />
            <div className="mt-2 h-3 w-32 rounded bg-border" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className={`${chartCard} min-h-[320px] animate-pulse`}>
            <div className="h-4 w-48 rounded bg-border" />
            <div className="mt-8 flex justify-center">
              <div className="h-36 w-36 rounded-full bg-border" />
            </div>
          </div>
        ))}
      </div>
      <div className={`${chartCard} animate-pulse`}>
        <div className="h-4 w-40 rounded bg-border" />
        <div className="mt-8 h-64 rounded-xl bg-border/60" />
      </div>
      <div className={`${chartCard} animate-pulse`}>
        <div className="h-4 w-56 rounded bg-border" />
        <div className="mt-6 h-48 rounded-xl bg-border/60" />
      </div>
    </div>
  );
}
