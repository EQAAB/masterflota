import { useTranslation } from "react-i18next";
import type { RentalPricing } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { pricingStatusClass, pricingStatusLabel } from "../rentalStatus";
import {
  derivePricingStatus,
  vehicleDisplayName,
  vehicleMeta,
  weeklySavingsPct,
} from "./pricingListUtils";

type PricingMobileCardProps = {
  row: RentalPricing;
  canManage?: boolean;
  onExpand: () => void;
  onActionMenuToggle: (id: string, el: HTMLElement) => void;
  isMenuOpen: boolean;
};

export function PricingMobileCard({
  row,
  canManage = false,
  onExpand,
  onActionMenuToggle,
  isMenuOpen,
}: PricingMobileCardProps) {
  const { t } = useTranslation();
  const status = derivePricingStatus(row);
  const savings = weeklySavingsPct(Number(row.daily_rate), Number(row.weekly_rate));

  return (
    <article className="fm-rental-pricing__mobile-card" onClick={onExpand} role="button" tabIndex={0}>
      <div className="flex items-start justify-between gap-2">
        <div>
          {row.license_plate ? (
            <span className="fm-rental-pricing__plate-badge">{row.license_plate}</span>
          ) : null}
          <p className="mt-1 font-semibold text-ink">{vehicleDisplayName(row)}</p>
          <p className="text-xs text-slate-500">{vehicleMeta(row)}</p>
        </div>
        {canManage ? (
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label={t("pages.pricing.rowActionsAriaLabel")}
            aria-expanded={isMenuOpen}
            onClick={(e) => {
              e.stopPropagation();
              onActionMenuToggle(row.id, e.currentTarget);
            }}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className={pricingStatusClass(status)}>{pricingStatusLabel(status)}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-slate-500">{t("pages.pricing.daily")}</dt>
          <dd className="font-bold">{formatCurrency(Number(row.daily_rate))}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{t("pages.pricing.weekly")}</dt>
          <dd className="font-bold">
            {formatCurrency(Number(row.weekly_rate))}
            {savings != null ? <span className="ml-1 text-xs text-emerald-700">-{savings}%</span> : null}
          </dd>
        </div>
      </dl>
    </article>
  );
}
