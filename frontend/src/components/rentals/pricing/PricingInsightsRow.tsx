import { useTranslation } from "react-i18next";
import type { RentalPricingInsights } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";

type PricingInsightsRowProps = {
  insights?: RentalPricingInsights;
  loading?: boolean;
};

export function PricingInsightsRow({ insights, loading }: PricingInsightsRowProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="fm-rental-pricing__skeleton h-24" />
        ))}
      </div>
    );
  }

  const most = insights?.most_rented_vehicle;
  const top = insights?.highest_earning_vehicle;

  const cards = [
    {
      key: "rented",
      label: t("pages.pricing.mostRentedVehicle"),
      value: most ? most.license_plate : t("common.emDash"),
      sub: most ? t("pages.pricing.completedActiveRentals", { count: most.booking_count }) : t("pages.pricing.noBookingDataYet"),
    },
    {
      key: "earning",
      label: t("pages.pricing.highestEarningVehicle"),
      value: top ? top.license_plate : t("common.emDash"),
      sub: top ? t("pages.pricing.paidRent", { amount: formatCurrency(Number(top.revenue)) }) : t("pages.pricing.noPaymentDataYet"),
    },
    {
      key: "util",
      label: t("pages.pricing.fleetUtilization"),
      value: `${insights?.best_utilization_pct ?? 0}%`,
      sub: t("pages.pricing.activeRentalsPerFleet"),
    },
    {
      key: "forecast",
      label: t("pages.pricing.revenueMtd"),
      value: formatCurrency(Number(insights?.revenue_forecast ?? 0)),
      sub: t("pages.pricing.paidRentThisMonth"),
    },
  ];

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">{t("pages.pricing.pricingAnalyticsTitle")}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card.key} className="fm-rental-pricing__insight-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
            <p className="mt-2 text-xl font-bold text-ink">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
            {card.key === "util" && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-300"
                  style={{ width: `${Math.min(100, insights?.best_utilization_pct ?? 0)}%` }}
                />
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
