import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { RentalPricing } from "../../../api/rentals";
import { createRentalPricing, updateRentalPricing } from "../../../api/rentals";
import { getVehicles, RENTAL_VEHICLE_DROPDOWN_LIMIT } from "../../../api/vehicles";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";

type PricingEditModalProps = {
  open: boolean;
  editing: RentalPricing | null;
  onClose: () => void;
};

export function PricingEditModal({ open, editing, onClose }: PricingEditModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [weeklyRate, setWeeklyRate] = useState("");
  const [monthlyRate, setMonthlyRate] = useState("");
  const [deposit, setDeposit] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles", "pricing-modal"],
    queryFn: () => getVehicles({ limit: RENTAL_VEHICLE_DROPDOWN_LIMIT }).then((r) => r.data.data),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setVehicleId(editing.vehicle_id ?? "");
      setVehicleType(editing.vehicle_type ?? "");
      setDailyRate(String(editing.daily_rate));
      setWeeklyRate(String(editing.weekly_rate));
      setMonthlyRate(String(editing.monthly_rate));
      setDeposit(String(editing.deposit_default));
      setEffectiveFrom(editing.effective_from?.slice(0, 10) ?? "");
      setEffectiveTo(editing.effective_to?.slice(0, 10) ?? "");
      setIsActive(editing.is_active);
    } else {
      setVehicleId("");
      setVehicleType("");
      setDailyRate("");
      setWeeklyRate("");
      setMonthlyRate("");
      setDeposit("0");
      setEffectiveFrom("");
      setEffectiveTo("");
      setIsActive(true);
    }
    setError(null);
  }, [open, editing]);

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        vehicleId: vehicleId || null,
        vehicleType: vehicleType || null,
        dailyRate: Number(dailyRate) || 0,
        weeklyRate: Number(weeklyRate) || 0,
        monthlyRate: Number(monthlyRate) || 0,
        depositDefault: Number(deposit) || 0,
        effectiveFrom: effectiveFrom || null,
        effectiveTo: effectiveTo || null,
        isActive,
      };
      if (editing) {
        return updateRentalPricing(editing.id, body);
      }
      return createRentalPricing(body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rentals", "pricing"] });
      void queryClient.invalidateQueries({ queryKey: ["rentals", "pricing", "summary"] });
      void queryClient.invalidateQueries({ queryKey: ["rentals", "pricing", "insights"] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg ?? t("pages.pricing.failedToSave"));
    },
  });

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[1px]"
        aria-label={t("common.close")}
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 z-[201] max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border/80 bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-lg font-semibold text-ink">
          {editing ? t("pages.pricing.editPricingRule") : t("pages.pricing.add")}
        </h2>

        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-ink">
            {t("pages.pricing.vehicleOptional")}
            <select
              className="fm-rental-pricing__filter-select mt-1 w-full"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">{t("pages.pricing.defaultAllVehiclesOption")}</option>
              {(vehiclesQuery.data ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.license_plate} — {v.make} {v.model}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-ink">
            {t("pages.pricing.vehicleTypeFilterOptional")}
            <input
              className="fm-rental-pricing__filter-select mt-1 w-full"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              placeholder={t("pages.pricing.vehicleTypeFilterPlaceholder")}
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-sm font-medium text-ink">
              {t("pages.pricing.dailyLabel")}
              <input
                type="number"
                min={0}
                step="0.01"
                className="fm-rental-pricing__filter-select mt-1 w-full"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              {t("pages.pricing.weeklyLabel")}
              <input
                type="number"
                min={0}
                step="0.01"
                className="fm-rental-pricing__filter-select mt-1 w-full"
                value={weeklyRate}
                onChange={(e) => setWeeklyRate(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              {t("pages.pricing.monthlyLabel")}
              <input
                type="number"
                min={0}
                step="0.01"
                className="fm-rental-pricing__filter-select mt-1 w-full"
                value={monthlyRate}
                onChange={(e) => setMonthlyRate(e.target.value)}
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-ink">
            {t("pages.pricing.depositDefault")}
            <input
              type="number"
              min={0}
              step="0.01"
              className="fm-rental-pricing__filter-select mt-1 w-full"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-medium text-ink">
              {t("pages.pricing.effectiveFrom")}
              <input
                type="date"
                className="fm-rental-pricing__filter-select mt-1 w-full"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              {t("pages.pricing.effectiveTo")}
              <input
                type="date"
                className="fm-rental-pricing__filter-select mt-1 w-full"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
              />
            </label>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300 text-brand"
            />
            {t("pages.pricing.activeRule")}
          </label>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btnSecondary} onClick={onClose} disabled={mutation.isPending}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className={btnPrimary}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </>
  );
}
