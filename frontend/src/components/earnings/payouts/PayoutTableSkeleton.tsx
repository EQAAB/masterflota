import { card } from "../../../theme/classNames";

export function PayoutTableSkeleton() {
  return (
    <div className={`${card} overflow-hidden space-y-3`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse flex gap-4">
          <div className="h-10 w-32 rounded-lg bg-slate-200/80" />
          <div className="h-10 flex-1 rounded-lg bg-slate-200/60" />
          <div className="h-10 w-24 rounded-lg bg-slate-200/80" />
          <div className="h-10 w-20 rounded-lg bg-slate-200/60" />
        </div>
      ))}
    </div>
  );
}
