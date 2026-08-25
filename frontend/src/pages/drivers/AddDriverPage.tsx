import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  createDriver,
  type CreateDriverPayload,
  type CommissionType,
} from "../../api/drivers";
import {
  PLATFORM_IDS,
  PLATFORM_ID_LABELS,
} from "../../constants/platformIds";
import { CommissionInput } from "../../components/drivers/CommissionInput";
import { getSubcontractors } from "../../api/subcontractors";

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  return /^[\d\s+\-()]{8,}$/.test(phone.replace(/\s/g, ""));
}

export function AddDriverPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const EMPLOYMENT_STATUSES = [
    { value: "active", label: t("driverStatus.active") },
    { value: "suspended", label: t("driverStatus.suspended") },
    { value: "terminated", label: t("driverStatus.terminated") },
  ] as const;

  const [form, setForm] = useState<CreateDriverPayload & {
    commissionType: CommissionType;
    fixedCommissionAmount: number;
    minimumCommission: number;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    licenseNumber: "",
    licenseExpiry: "",
    licenseClass: "",
    hireDate: "",
    employmentStatus: "active",
    commissionRate: 10,
    commissionType: "percentage",
    fixedCommissionAmount: 0,
    minimumCommission: 0,
    uberDriverId: "",
    boltDriverId: "",
    glovoCourierId: "",
    boltCourierId: "",
    boltTaxiDriverUuid: "",
    woltCourierId: "",
    notes: "",
    subcontractorId: "",
  });
  const [commissionErrors, setCommissionErrors] = useState<Partial<Record<string, string>>>({});

  const subsQ = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => getSubcontractors().then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (payload: CreateDriverPayload) => createDriver(payload),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setTimeout(() => navigate("/drivers"), 1500);
    },
  });

  const validate = (): string | null => {
    if (!form.firstName?.trim()) return t("pages.driverForm.firstNameRequiredError");
    if (!form.lastName?.trim()) return t("pages.driverForm.lastNameRequiredError");
    if (!form.phone?.trim()) return t("pages.driverForm.phoneRequiredError");
    if (form.phone && !validatePhone(form.phone)) return t("pages.driverForm.invalidPhoneError");
    if (form.email?.trim() && !validateEmail(form.email)) return t("pages.driverForm.invalidEmailError");
    const errs: Partial<Record<string, string>> = {};
    const type = form.commissionType ?? "percentage";
    if (type === "percentage" || type === "hybrid") {
      const rate = Number(form.commissionRate);
      if (Number.isNaN(rate) || rate < 0 || rate > 100) errs.commissionRate = t("pages.driverForm.commissionRateRangeError");
    }
    if (type === "fixed_amount" || type === "hybrid") {
      const fixed = Number(form.fixedCommissionAmount ?? 0);
      if (Number.isNaN(fixed) || fixed < 0) errs.fixedCommissionAmount = t("pages.driverForm.fixedAmountMinError");
    }
    const min = Number(form.minimumCommission ?? 0);
    if (!Number.isNaN(min) && min < 0) errs.minimumCommission = t("pages.driverForm.minimumCommissionNegativeError");
    setCommissionErrors(errs);
    if (Object.keys(errs).length > 0) return t("pages.driverForm.fixCommissionErrorsError");
    return null;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    const payload: CreateDriverPayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email?.trim() || undefined,
      dateOfBirth: form.dateOfBirth?.trim() || undefined,
      address: form.address?.trim() || undefined,
      licenseNumber: form.licenseNumber?.trim() || undefined,
      licenseExpiry: form.licenseExpiry?.trim() || undefined,
      licenseClass: form.licenseClass?.trim() || undefined,
      hireDate: form.hireDate?.trim() || undefined,
      employmentStatus: form.employmentStatus ?? "active",
      commissionRate: form.commissionRate ?? 10,
      commissionType: form.commissionType ?? "percentage",
      fixedCommissionAmount: form.fixedCommissionAmount ?? 0,
      minimumCommission: form.minimumCommission ?? 0,
      uberDriverId: form.uberDriverId?.trim() || undefined,
      boltDriverId: form.boltDriverId?.trim() || undefined,
      glovoCourierId: form.glovoCourierId?.trim() || undefined,
      boltCourierId: form.boltCourierId?.trim() || undefined,
      boltTaxiDriverUuid: form.boltTaxiDriverUuid?.trim() || undefined,
      woltCourierId: form.woltCourierId?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
      subcontractorId: form.subcontractorId?.trim() ? form.subcontractorId.trim() : undefined,
    };
    mutation.mutate(payload);
  };

  const update = (
    key:
      | keyof CreateDriverPayload
      | "commissionType"
      | "fixedCommissionAmount"
      | "minimumCommission"
      | "glovoCourierId"
      | "boltCourierId"
      | "boltTaxiDriverUuid"
      | "woltCourierId"
      | "subcontractorId",
    value: string | number | undefined,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <p className="text-green-600 font-medium">{t("pages.driverForm.driverCreatedSuccess")}</p>
          <p className="text-sm text-ink-muted mt-1">{t("pages.driverForm.redirectingToDriversList")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-100">
      <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">{t("pages.driverAdd.title")}</h1>
        <Link
          to="/drivers"
          className="text-sm text-ink-muted hover:text-ink"
        >
          ← {t("pages.driverForm.backToDrivers")}
        </Link>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <form onSubmit={onSubmit} className="bg-white shadow-sm rounded-xl p-6 space-y-6">
          {/* Personal Info */}
          <section>
            <h2 className="text-sm font-semibold text-ink mb-3">{t("pages.driverForm.personalInfoTitle")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.driverForm.firstNameRequiredLabel")}</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.driverForm.lastNameRequiredLabel")}</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.users.emailLabel")}</label>
                <input
                  type="email"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.email ?? ""}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.driverForm.phoneRequiredLabel")}</label>
                <input
                  type="tel"
                  required
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.driverForm.dateOfBirthLabel")}</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.dateOfBirth ?? ""}
                  onChange={(e) => update("dateOfBirth", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.invoiceDetail.addressLabel")}</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.address ?? ""}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* License Info */}
          <section>
            <h2 className="text-sm font-semibold text-ink mb-3">{t("pages.driverForm.licenseInfoTitle")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.driverForm.licenseNumberLabel")}</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.licenseNumber ?? ""}
                  onChange={(e) => update("licenseNumber", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.driverForm.licenseExpiryLabel")}</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.licenseExpiry ?? ""}
                  onChange={(e) => update("licenseExpiry", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.driverForm.licenseClassLabel")}</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.licenseClass ?? ""}
                  onChange={(e) => update("licenseClass", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Employment */}
          <section>
            <h2 className="text-sm font-semibold text-ink mb-3">{t("pages.driverForm.employmentTitle")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.driverForm.hireDateLabel")}</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.hireDate ?? ""}
                  onChange={(e) => update("hireDate", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("common.status")}</label>
                <select
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.employmentStatus ?? "active"}
                  onChange={(e) => update("employmentStatus", e.target.value as "active" | "suspended" | "terminated")}
                >
                  {EMPLOYMENT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1">{t("pages.driverForm.subcontractorOptionalLabel")}</label>
                <select
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.subcontractorId ?? ""}
                  onChange={(e) => update("subcontractorId", e.target.value)}
                >
                  <option value="">{t("pages.driverForm.noneDirectOption")}</option>
                  {(subsQ.data ?? [])
                    .filter((s) => s.status === "active")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.legal_name}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-ink-muted">
                  {t("pages.driverForm.subManagedHint")}
                </p>
              </div>
            </div>
          </section>

          {/* Commission */}
          <section>
            <h2 className="text-sm font-semibold text-ink mb-3">{t("pages.driverForm.commissionTitle")}</h2>
            <CommissionInput
              commissionType={form.commissionType ?? "percentage"}
              commissionRate={form.commissionRate ?? 10}
              fixedCommissionAmount={form.fixedCommissionAmount ?? 0}
              minimumCommission={form.minimumCommission ?? 0}
              onChange={(values) => {
                if (values.commissionType != null) update("commissionType", values.commissionType);
                if (values.commissionRate != null) update("commissionRate", values.commissionRate);
                if (values.fixedCommissionAmount != null) update("fixedCommissionAmount", values.fixedCommissionAmount);
                if (values.minimumCommission != null) update("minimumCommission", values.minimumCommission);
              }}
              errors={commissionErrors}
            />
          </section>

          {/* Platform IDs */}
          <section>
            <h2 className="text-sm font-semibold text-ink mb-3">{t("pages.driverForm.platformIdsTitle")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  {t("pages.driverForm.driverIdSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.UBER] })}
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.uberDriverId ?? ""}
                  onChange={(e) => update("uberDriverId", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  {t("pages.driverForm.driverIdSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.BOLT] })}
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.boltDriverId ?? ""}
                  onChange={(e) => update("boltDriverId", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  {t("pages.driverForm.courierIdSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.GLOVO] })}
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.glovoCourierId ?? ""}
                  onChange={(e) => update("glovoCourierId", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  {t("pages.driverForm.platformIdSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.BOLT_COURIER] })}
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.boltCourierId ?? ""}
                  onChange={(e) => update("boltCourierId", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  {t("pages.driverForm.driverUuidSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.BOLT_TAXI] })}
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.boltTaxiDriverUuid ?? ""}
                  onChange={(e) => update("boltTaxiDriverUuid", e.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  {t("pages.driverForm.courierIdSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.WOLT] })}
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.woltCourierId ?? ""}
                  onChange={(e) => update("woltCourierId", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Notes */}
          <section>
            <label className="block text-sm font-medium text-ink mb-1">{t("pages.invoiceDetail.notesLabel")}</label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              value={form.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
            />
          </section>

          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}
          {mutation.isError && !formError && (
            <p className="text-sm text-red-600">
              {(mutation.error as Error).message || t("pages.driverForm.failedToCreateDriver")}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center justify-center rounded-md bg-brand-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
            >
              {mutation.isPending ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t("pages.driverForm.creatingButton")}
                </>
              ) : (
                t("pages.driverForm.createDriverButton")
              )}
            </button>
            <Link
              to="/drivers"
              className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50"
            >
              {t("common.cancel")}
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
