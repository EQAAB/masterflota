import type { FormEvent } from "react";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getVehicleById,
  updateVehicle,
  type CreateVehiclePayload,
  type UpdateVehiclePayload,
  type Vehicle,
} from "../../api/vehicles";
import { getDrivers } from "../../api/drivers";

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const d = value.split("T")[0];
  return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
}

type VehicleFormState = CreateVehiclePayload & { status: string; currentDriverId: string };

function vehicleToForm(v: Vehicle): VehicleFormState {
  return {
    vehicleType: v.vehicle_type ?? "car",
    make: v.make ?? "",
    model: v.model ?? "",
    year: v.year ?? undefined,
    color: v.color ?? "",
    licensePlate: v.license_plate ?? "",
    vin: v.vin ?? "",
    fuelType: v.fuel_type ?? "",
    transmission: v.transmission ?? "",
    seatingCapacity: v.seating_capacity ?? undefined,
    dailyRent: v.daily_rent != null ? Number(v.daily_rent) : 0,
    weeklyRent: v.weekly_rent != null ? Number(v.weekly_rent) : 0,
    monthlyRent: v.monthly_rent != null ? Number(v.monthly_rent) : 0,
    insuranceExpiry: toDateInputValue(v.insurance_expiry),
    registrationExpiry: toDateInputValue(v.registration_expiry),
    status: v.status ?? "available",
    notes: v.notes ?? "",
    currentDriverId: v.current_driver_id ?? "",
  };
}

export function EditVehiclePage() {
  const { t } = useTranslation();
  const VEHICLE_STATUSES = [
    { value: "available", label: t("vehicleStatus.available") },
    { value: "rented", label: t("vehicleStatus.rented") },
    { value: "maintenance", label: t("vehicleStatus.maintenance") },
    { value: "sold", label: t("vehicleStatus.sold") },
    { value: "scrapped", label: t("vehicleStatus.scrapped") },
  ] as const;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleFormState | null>(null);

  const { data: vehicleRes, isLoading: loadingVehicle, isError: vehicleError } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicleById(id!),
    enabled: !!id,
  });

  const { data: driversList } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data } = await getDrivers();
      return data;
    },
  });

  const vehicle = vehicleRes?.data;

  useEffect(() => {
    if (vehicle) setForm(vehicleToForm(vehicle));
  }, [vehicle]);

  const mutation = useMutation({
    mutationFn: (payload: UpdateVehiclePayload) => updateVehicle(id!, payload),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", id] });
      setTimeout(() => navigate("/vehicles"), 1500);
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const msg =
          typeof err.response?.data?.message === "string"
            ? err.response.data.message
            : t("pages.vehicleForm.failedToUpdateVehicle");
        setFormError(msg);
        return;
      }
      setFormError(err instanceof Error ? err.message : t("pages.vehicleForm.failedToUpdateVehicle"));
    },
  });

  const validate = (): string | null => {
    if (!form) return null;
    if (!form.vehicleType?.trim()) return t("pages.vehicleForm.vehicleTypeRequiredError");
    if (!form.make?.trim()) return t("pages.vehicleForm.makeRequiredError");
    if (!form.model?.trim()) return t("pages.vehicleForm.modelRequiredError");
    if (!form.licensePlate?.trim()) return t("pages.vehicleForm.licensePlateRequiredError");
    const daily = Number(form.dailyRent);
    const weekly = Number(form.weeklyRent);
    const monthly = Number(form.monthlyRent);
    if (!Number.isNaN(daily) && daily < 0) return t("pages.vehicleForm.dailyRentNegativeError");
    if (!Number.isNaN(weekly) && weekly < 0) return t("pages.vehicleForm.weeklyRentNegativeError");
    if (!Number.isNaN(monthly) && monthly < 0) return t("pages.vehicleForm.monthlyRentNegativeError");
    return null;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    const payload: UpdateVehiclePayload = {
      vehicleType: form.vehicleType.trim(),
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year,
      color: form.color?.trim() || undefined,
      licensePlate: form.licensePlate.trim(),
      vin: form.vin?.trim() || undefined,
      fuelType: form.fuelType?.trim() || undefined,
      transmission: form.transmission?.trim() || undefined,
      seatingCapacity: form.seatingCapacity,
      dailyRent: form.dailyRent ?? 0,
      weeklyRent: form.weeklyRent ?? 0,
      monthlyRent: form.monthlyRent ?? 0,
      insuranceExpiry: form.insuranceExpiry?.trim() || undefined,
      registrationExpiry: form.registrationExpiry?.trim() || undefined,
      status: form.status as Vehicle["status"],
      currentDriverId: form.currentDriverId || null,
      notes: form.notes?.trim() || undefined,
    };
    mutation.mutate(payload);
  };

  const update = (key: keyof VehicleFormState, value: string | number | undefined) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-ink-muted">{t("pages.vehicleDocuments.missingVehicleIdError")}</p>
        <Link to="/vehicles" className="ml-2 text-brand hover:underline">{t("pages.vehicleDocuments.backToVehicles")}</Link>
      </div>
    );
  }

  if (loadingVehicle || !form) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-block w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink-muted">{t("pages.vehicleForm.loadingVehicle")}</p>
        </div>
      </div>
    );
  }

  if (vehicleError) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-md">
          <p className="text-red-600">{t("pages.vehicleForm.failedToLoadVehicle")}</p>
          <Link to="/vehicles" className="mt-3 inline-block text-sm text-brand hover:underline">
            {t("pages.vehicleDocuments.backToVehicles")}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <p className="text-green-600 font-medium">{t("pages.vehicleForm.vehicleUpdatedSuccess")}</p>
          <p className="text-sm text-ink-muted mt-1">{t("pages.vehicleForm.redirectingToVehiclesList")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-100">
      <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">{t("pages.vehicleEdit.title")}</h1>
        <Link to={`/vehicles/${id}`} className="text-sm text-ink-muted hover:text-ink">
          ← {t("pages.vehicleForm.backToVehicle")}
        </Link>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <form onSubmit={onSubmit} className="bg-white shadow-sm rounded-xl p-6 space-y-6">
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{formError}</p>
          )}

          <section>
            <h2 className="text-sm font-semibold text-ink mb-3">{t("pages.vehicleForm.basicInfoTitle")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleForm.vehicleTypeRequiredLabel")}</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.vehicleType}
                  onChange={(e) => update("vehicleType", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleForm.makeRequiredLabel")}</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.make}
                  onChange={(e) => update("make", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleForm.modelRequiredLabel")}</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.model}
                  onChange={(e) => update("model", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleForm.yearLabel")}</label>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.year ?? ""}
                  onChange={(e) =>
                    update("year", e.target.value ? parseInt(e.target.value, 10) : undefined)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleForm.colorLabel")}</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.color ?? ""}
                  onChange={(e) => update("color", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleForm.licensePlateRequiredLabel")}</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                  value={form.licensePlate}
                  onChange={(e) => update("licensePlate", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleForm.vinLabel")}</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.vin ?? ""}
                  onChange={(e) => update("vin", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleForm.currentDriverLabel")}</label>
                <select
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.currentDriverId}
                  onChange={(e) => update("currentDriverId", e.target.value)}
                >
                  <option value="">{t("pages.vehicleForm.noneOption")}</option>
                  {driversList?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.first_name} {d.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleForm.fuelTypeLabel")}</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.fuelType ?? ""}
                  onChange={(e) => update("fuelType", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleForm.transmissionLabel")}</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.transmission ?? ""}
                  onChange={(e) => update("transmission", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleForm.seatingCapacityLabel")}</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.seatingCapacity ?? ""}
                  onChange={(e) =>
                    update(
                      "seatingCapacity",
                      e.target.value ? parseInt(e.target.value, 10) : undefined,
                    )
                  }
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-ink mb-3">{t("pages.vehicleForm.rentalRatesTitle")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleForm.dailyRentLabel")}</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.dailyRent ?? 0}
                  onChange={(e) => update("dailyRent", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1" title={t("pages.vehicleForm.weeklyRentTooltip")}>
                  {t("pages.vehicleForm.weeklyRentLabel")}
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.weeklyRent ?? 0}
                  onChange={(e) => update("weeklyRent", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleForm.monthlyRentLabel")}</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.monthlyRent ?? 0}
                  onChange={(e) => update("monthlyRent", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-ink mb-3">{t("pages.vehicleForm.datesStatusTitle")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleForm.insuranceExpiryLabel")}</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.insuranceExpiry ?? ""}
                  onChange={(e) => update("insuranceExpiry", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleForm.registrationExpiryLabel")}</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.registrationExpiry ?? ""}
                  onChange={(e) => update("registrationExpiry", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("common.status")}</label>
                <select
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                >
                  {VEHICLE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section>
            <label className="block text-sm font-medium text-ink mb-1">{t("pages.invoiceDetail.notesLabel")}</label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              value={form.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
            />
          </section>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-brand-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
            >
              {mutation.isPending ? t("pages.vehicleForm.savingButton") : t("pages.users.saveChangesButton")}
            </button>
            <Link
              to={`/vehicles/${id}`}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50"
            >
              {t("common.cancel")}
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
