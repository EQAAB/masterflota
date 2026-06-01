import type { RentalPricing } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { depositLabel, weeklySavingsPct } from "./pricingListUtils";

type PricingExpandPanelProps = {
  row: RentalPricing;
};

export function PricingExpandPanel({ row }: PricingExpandPanelProps) {
  const daily = Number(row.daily_rate);
  const weekly = Number(row.weekly_rate);
  const savings = weeklySavingsPct(daily, weekly);
  const fullWeek = daily * 7;

  return (
    <div className="fm-rental-pricing__expand-panel">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Plan type</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {row.vehicle_id ? "Vehicle-specific rate card" : "Organization / type default"}
          </p>
          {row.vehicle_type ? (
            <p className="mt-0.5 text-xs text-slate-500">Type filter: {row.vehicle_type}</p>
          ) : null}
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Effective period</p>
          <p className="mt-1 text-sm text-ink">
            {row.effective_from ?? "No start"} → {row.effective_to ?? "No end"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Leave empty for always-on pricing</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Weekly vs daily</p>
          <p className="mt-1 text-sm text-ink">
            7× daily = {formatCurrency(fullWeek)} · weekly = {formatCurrency(weekly)}
          </p>
          {savings != null ? (
            <p className="mt-0.5 text-xs font-medium text-emerald-700">Save {savings}% on weekly rental</p>
          ) : (
            <p className="mt-0.5 text-xs text-slate-500">No weekly discount vs daily×7</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Deposit</p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {formatCurrency(Number(row.deposit_default))}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{depositLabel(Number(row.deposit_default))}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Seasonal/weekend sub-rates are not configured in this version — use effective dates above for seasonal
        plans.
      </p>
    </div>
  );
}
