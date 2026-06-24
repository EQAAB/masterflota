import { Link } from "react-router-dom";
import { FilterChip } from "../../theme/FilterBar";
import { filterInputClass, filterSelectClass } from "./PayoutFiltersCard";

export type PayoutUnifiedToolbarProps = {
  q: string;
  onQChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  platform: string;
  onPlatformChange: (v: string) => void;
  weekStart: string;
  weekEnd: string;
  onWeekStartChange: (v: string) => void;
  onWeekEndChange: (v: string) => void;
  activeChips: { key: string; label: string; onRemove: () => void }[];
};

const PLATFORM_OPTIONS = [
  { value: "", label: "All platforms" },
  { value: "glovo", label: "Glovo" },
  { value: "bolt", label: "Bolt" },
  { value: "bolt_taxi", label: "Bolt Taxi" },
  { value: "uber", label: "Uber" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "payable", label: "Ready to pay" },
  { value: "paid", label: "Paid" },
  { value: "debt", label: "Debt" },
  { value: "hold", label: "Hold" },
  { value: "partial", label: "Partial" },
];

const fieldWrap = "min-w-0";

export function PayoutUnifiedToolbar({
  q,
  onQChange,
  status,
  onStatusChange,
  platform,
  onPlatformChange,
  weekStart,
  weekEnd,
  onWeekStartChange,
  onWeekEndChange,
  activeChips,
}: PayoutUnifiedToolbarProps) {
  return (
    <div className="fm-payout-filters">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <div className={`${fieldWrap} lg:col-span-2`}>
          <label className="mb-1 block truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Quick search
          </label>
          <input
            type="search"
            placeholder="Name, phone, platform ID…"
            className={filterInputClass}
            value={q}
            onChange={(e) => onQChange(e.target.value)}
          />
        </div>
        <div className={fieldWrap}>
          <label className="mb-1 block truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Status
          </label>
          <select className={filterSelectClass} value={status} onChange={(e) => onStatusChange(e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className={fieldWrap}>
          <label className="mb-1 block truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Platform
          </label>
          <select
            className={filterSelectClass}
            value={platform}
            onChange={(e) => onPlatformChange(e.target.value)}
          >
            {PLATFORM_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className={fieldWrap}>
          <label className="mb-1 block truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Week start
          </label>
          <input
            type="date"
            className={filterInputClass}
            value={weekStart}
            onChange={(e) => onWeekStartChange(e.target.value)}
          />
        </div>
        <div className={fieldWrap}>
          <label className="mb-1 block truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Week end
          </label>
          <input
            type="date"
            className={filterInputClass}
            value={weekEnd}
            onChange={(e) => onWeekEndChange(e.target.value)}
          />
        </div>
        <div className={`${fieldWrap} flex flex-col justify-end`}>
          <label className="mb-1 block truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Subcontractor
          </label>
          <Link
            to="/earnings/subcontractors/settlements"
            className={`${filterSelectClass} flex h-10 min-h-[40px] items-center justify-center text-xs font-medium text-brand hover:bg-white`}
          >
            Settlements
          </Link>
        </div>
      </div>
      {activeChips.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip) => (
            <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
