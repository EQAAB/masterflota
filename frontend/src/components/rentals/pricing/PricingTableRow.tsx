import type { RentalPricing } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import {
  pricingStatusClass,
  pricingStatusLabel,
  vehicleFleetStatusClass,
  vehicleFleetStatusLabel,
} from "../rentalStatus";
import { PricingExpandPanel } from "./PricingExpandPanel";
import {
  derivePricingStatus,
  depositLabel,
  vehicleDisplayName,
  vehicleMeta,
  weeklySavingsPct,
} from "./pricingListUtils";

type PricingTableRowProps = {
  row: RentalPricing;
  expanded: boolean;
  canManage?: boolean;
  onToggleExpand: () => void;
  onActionMenuToggle: (id: string, el: HTMLElement) => void;
  isMenuOpen: boolean;
};

export function PricingTableRow({
  row,
  expanded,
  canManage = false,
  onToggleExpand,
  onActionMenuToggle,
  isMenuOpen,
}: PricingTableRowProps) {
  const status = derivePricingStatus(row);
  const daily = Number(row.daily_rate);
  const weekly = Number(row.weekly_rate);
  const savings = weeklySavingsPct(daily, weekly);
  const deposit = Number(row.deposit_default);

  return (
    <>
      <tr
        className={`fm-rental-pricing__row cursor-pointer ${expanded ? "fm-rental-pricing__row--expanded" : ""}`}
        onClick={onToggleExpand}
      >
        <td>
          <div className="flex items-center gap-3">
            <div className="fm-rental-pricing__thumb">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              {row.license_plate ? (
                <span className="fm-rental-pricing__plate-badge">{row.license_plate}</span>
              ) : (
                <span className="text-xs font-medium text-slate-500">Default rule</span>
              )}
              <p className="mt-1 font-medium text-ink">{vehicleDisplayName(row)}</p>
              <p className="text-xs capitalize text-slate-500">{vehicleMeta(row) || "—"}</p>
            </div>
          </div>
        </td>
        <td>
          <p className="font-bold tabular-nums text-ink">{formatCurrency(daily)}</p>
          <p className="fm-rental-pricing__rate-sublabel">Per day</p>
        </td>
        <td>
          <p className="font-bold tabular-nums text-ink">{formatCurrency(weekly)}</p>
          {savings != null ? (
            <p className="text-xs font-medium text-emerald-700">Save {savings}%</p>
          ) : (
            <p className="fm-rental-pricing__rate-sublabel">Per week</p>
          )}
        </td>
        <td>
          <p className="font-bold tabular-nums text-ink">{formatCurrency(Number(row.monthly_rate))}</p>
          <p className="fm-rental-pricing__rate-sublabel">Long-term rental</p>
        </td>
        <td>
          <p className="font-semibold tabular-nums text-ink">{formatCurrency(deposit)}</p>
          <span className="mt-0.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {depositLabel(deposit)}
          </span>
        </td>
        <td>
          {row.vehicle_status ? (
            <span className={vehicleFleetStatusClass(row.vehicle_status)}>
              {vehicleFleetStatusLabel(row.vehicle_status)}
            </span>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </td>
        <td>
          <span className={pricingStatusClass(status)}>{pricingStatusLabel(status)}</span>
        </td>
        {canManage ? (
          <td className="text-right" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Actions"
              aria-expanded={isMenuOpen}
              onClick={(e) => onActionMenuToggle(row.id, e.currentTarget)}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </td>
        ) : null}
      </tr>
      {expanded ? (
        <tr>
          <td colSpan={canManage ? 8 : 7} className="!p-0">
            <PricingExpandPanel row={row} />
          </td>
        </tr>
      ) : null}
    </>
  );
}
