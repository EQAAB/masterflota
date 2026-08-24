import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { RentalAvailabilityVehicle } from "../../../api/rentals";
import { createAvailabilityBlock } from "../../../api/rentals";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";

type BlockDatesModalProps = {
  open: boolean;
  vehicles: RentalAvailabilityVehicle[];
  initialVehicleId?: string;
  defaultFrom: string;
  defaultTo: string;
  onClose: () => void;
};

export function BlockDatesModal({
  open,
  vehicles,
  initialVehicleId,
  defaultFrom,
  defaultTo,
  onClose,
}: BlockDatesModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [vehicleId, setVehicleId] = useState(initialVehicleId ?? "");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setVehicleId(initialVehicleId ?? vehicles[0]?.id ?? "");
      setFrom(defaultFrom);
      setTo(defaultTo);
      setNotes("");
      setError(null);
    }
  }, [open, initialVehicleId, vehicles, defaultFrom, defaultTo]);

  const mutation = useMutation({
    mutationFn: () =>
      createAvailabilityBlock({
        vehicleId,
        from,
        to,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rentals", "availability"] });
      void queryClient.invalidateQueries({ queryKey: ["rentals", "availability", "summary"] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg ?? t("pages.availability.failedToBlockDates"));
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
        className="fixed left-1/2 top-1/2 z-[201] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/80 bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-dates-title"
      >
        <h2 id="block-dates-title" className="text-lg font-semibold text-ink">
          {t("pages.availability.blockDates")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t("pages.availability.blockDatesModalDesc")}
        </p>

        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-ink">
            {t("pages.rentalCalendar.vehicleLabel")}
            <select
              className="fm-rental-availability__filter-select mt-1 w-full"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">{t("pages.availability.selectVehicle")}</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.license_plate} — {v.make} {v.model}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-ink">
              {t("pages.availability.fromLabel")}
              <input
                type="date"
                className="fm-rental-availability__filter-select mt-1 w-full"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              {t("pages.availability.toLabel")}
              <input
                type="date"
                className="fm-rental-availability__filter-select mt-1 w-full"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-ink">
            {t("pages.availability.notesOptional")}
            <textarea
              className="fm-rental-availability__filter-select mt-1 w-full min-h-[72px] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
            disabled={!vehicleId || !from || !to || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? t("common.saving") : t("pages.availability.blockDates")}
          </button>
        </div>
      </div>
    </>
  );
}
