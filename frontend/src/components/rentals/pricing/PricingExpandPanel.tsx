import { useTranslation } from "react-i18next";
import type { RentalPricing } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { depositLabel, weeklySavingsPct } from "./pricingListUtils";

type PricingExpandPanelProps = {
  row: RentalPricing;
};

export function PricingExpandPanel({ row }: PricingExpandPanelProps) {
  const { t } = useTranslation();
  const daily = Number(row.daily_rate);
  const weekly = Number(row.weekly_rate);
  const savings = weeklySavingsPct(daily, weekly);
  const fullWeek = daily * 7;

  return (
    <div className="fm-rental-pricing__expand-panel">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("pages.pricing.planTypeLabel")}</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {row.vehicle_id ? t("pages.pricing.vehicleSpecificRateCard") : t("pages.pricing.orgTypeDefault")}
          </p>
          {row.vehicle_type ? (
            <p className="mt-0.5 text-xs text-slate-500">{t("pages.pricing.typeFilterLabel", { type: row.vehicle_type })}</p>
          ) : null}
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("pages.pricing.effectivePeriodLabel")}</p>
          <p className="mt-1 text-sm text-ink">
            {row.effective_from ?? t("pages.pricing.noStart")} → {row.effective_to ?? t("pages.pricing.noEnd")}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{t("pages.pricing.leaveEmptyAlwaysOn")}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("pages.pricing.weeklyVsDailyLabel")}</p>
          <p className="mt-1 text-sm text-ink">
            {t("pages.pricing.sevenXDaily", { full: formatCurrency(fullWeek), weekly: formatCurrency(weekly) })}
          </p>
          {savings != null ? (
            <p className="mt-0.5 text-xs font-medium text-emerald-700">{t("pages.pricing.saveWeeklyDiscount", { pct: savings })}</p>
          ) : (
            <p className="mt-0.5 text-xs text-slate-500">{t("pages.pricing.noWeeklyDiscount")}</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("pages.pricing.colDeposit")}</p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {formatCurrency(Number(row.deposit_default))}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{depositLabel(Number(row.deposit_default))}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        {t("pages.pricing.seasonalNote")}
      </p>
    </div>
  );
}
