import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import type { RentalDashboard } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { RentalDashboardCard } from "./RentalDashboardCard";

type RentalRevenuePreviewProps = {
  data?: RentalDashboard;
  loading?: boolean;
  className?: string;
};

export function RentalRevenuePreview({ data, loading, className }: RentalRevenuePreviewProps) {
  const { t } = useTranslation();
  const chartData = data?.weekly_revenue ?? [];
  const fleetTotal = data?.fleet?.total ?? 0;
  const occupancyPct =
    fleetTotal > 0 ? Math.round(((data?.active_bookings ?? 0) / fleetTotal) * 100) : 0;

  return (
    <RentalDashboardCard title={t("pages.rentalDashboard.revenueAnalyticsTitle")} viewAllTo="/rentals/payments" viewAllLabel={t("pages.rentalDashboard.allPayments")} className={className}>
      {loading ? (
        <div className="fm-rental-dashboard__skeleton h-56" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {chartData.length === 0 ? (
              <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-border bg-slate-50/50 text-sm text-ink-muted">
                {t("pages.rentalDashboard.noPaidRent")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rentalRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00a082" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#00a082" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={48} />
                  <Tooltip
                    formatter={(value: number | undefined) => [formatCurrency(Number(value ?? 0)), t("pages.rentalDashboard.tooltipRevenue")]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#00a082"
                    strokeWidth={2}
                    fill="url(#rentalRevenueFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-col justify-center gap-4 lg:col-span-4">
            <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800/80">{t("pages.rentalDashboard.mtdRevenue")}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
                {formatCurrency(Number(data?.mtd_revenue ?? 0))}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/70 bg-slate-50/80 p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-500">{t("pages.rentalDashboard.occupancyLabel")}</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-ink">{occupancyPct}%</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-slate-50/80 p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-500">{t("pages.rentalDashboard.confirmedLabel")}</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-ink">{data?.confirmed_bookings ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </RentalDashboardCard>
  );
}
