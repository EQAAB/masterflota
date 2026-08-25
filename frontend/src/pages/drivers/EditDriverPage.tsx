import type { FormEvent, ReactNode } from "react";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getDriverById,
  updateDriver,
  type CreateDriverPayload,
  type CommissionType,
  type Driver,
} from "../../api/drivers";
import {
  PLATFORM_IDS,
  PLATFORM_ID_LABELS,
} from "../../constants/platformIds";
import { CommissionInput } from "../../components/drivers/CommissionInput";
import { getSubcontractors } from "../../api/subcontractors";
import { DocumentUpload } from "../../components/documents/DocumentUpload";
import { DocumentList } from "../../components/documents/DocumentList";
import { PageHeader } from "../../components/theme/PageHeader";

const inputClass =
  "h-11 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[16px] border border-border/70 bg-white p-5 shadow-soft sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  return /^[\d\s+\-()]{8,}$/.test(phone.replace(/\s/g, ""));
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const d = value.split("T")[0];
  return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
}

function driverToForm(
  d: Driver
): CreateDriverPayload & {
  commissionType: CommissionType;
  fixedCommissionAmount: number;
  minimumCommission: number;
} {
  const commissionType = (d.commission_type as CommissionType) || "percentage";
  return {
    firstName: d.first_name ?? "",
    lastName: d.last_name ?? "",
    email: d.email ?? "",
    phone: d.phone ?? "",
    dateOfBirth: toDateInputValue(d.date_of_birth),
    address: d.address ?? "",
    licenseNumber: d.license_number ?? "",
    licenseExpiry: toDateInputValue(d.license_expiry),
    licenseClass: d.license_class ?? "",
    hireDate: toDateInputValue(d.hire_date),
    employmentStatus: (d.employment_status as "active" | "suspended" | "terminated") ?? "active",
    commissionRate: d.commission_rate != null ? Number(d.commission_rate) : 10,
    commissionType,
    fixedCommissionAmount:
      d.fixed_commission_amount != null ? Number(d.fixed_commission_amount) : 0,
    minimumCommission:
      d.minimum_commission != null ? Number(d.minimum_commission) : 0,
    uberDriverId: d.uber_driver_id ?? "",
    boltDriverId: d.bolt_driver_id ?? "",
    glovoCourierId: d.glovo_courier_id ?? "",
    boltCourierId: d.bolt_courier_id ?? "",
    boltTaxiDriverUuid: d.bolt_taxi_driver_uuid ?? "",
    woltCourierId: d.wolt_courier_id ?? "",
    notes: d.notes ?? "",
    subcontractorId: d.subcontractor_id ?? "",
  };
}

export function EditDriverPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [commissionErrors, setCommissionErrors] = useState<Partial<Record<string, string>>>({});
  const EMPLOYMENT_STATUSES = [
    { value: "active", label: t("driverStatus.active") },
    { value: "suspended", label: t("driverStatus.suspended") },
    { value: "terminated", label: t("driverStatus.terminated") },
  ] as const;
  const [form, setForm] = useState<(CreateDriverPayload & {
    commissionType: CommissionType;
    fixedCommissionAmount: number;
    minimumCommission: number;
  }) | null>(null);

  const subsQ = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => getSubcontractors().then((r) => r.data),
  });

  const {
    data: driverResponse,
    isLoading: loadingDriver,
    isError: driverError,
  } = useQuery({
    queryKey: ["driver", id],
    queryFn: () => getDriverById(id!),
    enabled: !!id,
  });

  const driver = driverResponse?.data;

  useEffect(() => {
    if (driver) {
      setForm(driverToForm(driver));
    }
  }, [driver]);

  const mutation = useMutation({
    mutationFn: (payload: CreateDriverPayload) => updateDriver(id!, payload),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["driver", id] });
      setTimeout(() => navigate("/drivers"), 1500);
    },
  });

  const validate = (): string | null => {
    if (!form) return null;
    if (!form.firstName?.trim()) return t("pages.driverForm.firstNameRequiredError");
    if (!form.lastName?.trim()) return t("pages.driverForm.lastNameRequiredError");
    if (!form.phone?.trim()) return t("pages.driverForm.phoneRequiredError");
    if (form.phone && !validatePhone(form.phone)) return t("pages.driverForm.invalidPhoneError");
    if (form.email?.trim() && !validateEmail(form.email)) return t("pages.driverForm.invalidEmailError");
    const errs: Partial<Record<string, string>> = {};
    const type = form.commissionType ?? "percentage";
    if (type === "percentage" || type === "hybrid") {
      const rate = Number(form.commissionRate);
      if (Number.isNaN(rate) || rate < 0 || rate > 100)
        errs.commissionRate = t("pages.driverForm.commissionRateRangeError");
    }
    if (type === "fixed_amount" || type === "hybrid") {
      const fixed = Number(form.fixedCommissionAmount ?? 0);
      if (Number.isNaN(fixed) || fixed < 0)
        errs.fixedCommissionAmount = t("pages.driverForm.fixedAmountMinError");
    }
    const min = Number(form.minimumCommission ?? 0);
    if (!Number.isNaN(min) && min < 0)
      errs.minimumCommission = t("pages.driverForm.minimumCommissionNegativeError");
    setCommissionErrors(errs);
    if (Object.keys(errs).length > 0) return t("pages.driverForm.fixCommissionErrorsError");
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
      subcontractorId: form.subcontractorId?.trim() ? form.subcontractorId.trim() : null,
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
    value: string | number | undefined
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-ink-muted">{t("pages.driverForm.missingDriverIdError")}</p>
        <Link to="/drivers" className="ml-2 text-brand hover:underline">
          {t("pages.driverForm.backToDrivers")}
        </Link>
      </div>
    );
  }

  if (loadingDriver || form === null) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-block w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink-muted">{t("pages.driverForm.loadingDriver")}</p>
        </div>
      </div>
    );
  }

  if (driverError) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-md">
          <p className="text-red-600">{t("pages.driverForm.failedToLoadDriver")}</p>
          <Link to="/drivers" className="mt-3 inline-block text-sm text-brand hover:underline">
            {t("pages.driverForm.backToDrivers")}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <p className="text-green-600 font-medium">{t("pages.driverForm.driverUpdatedSuccess")}</p>
          <p className="text-sm text-ink-muted mt-1">{t("pages.driverForm.redirectingToDriversList")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-100">
      <div className="border-b border-border/60 bg-surface-card/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <PageHeader
            title={t("pages.driverEdit.title")}
            description={t("pages.driverEdit.subtitle")}
            breadcrumbs={[
              { label: t("nav.dashboard"), to: "/dashboard" },
              { label: t("nav.drivers"), to: "/drivers" },
              { label: t("pages.driverEdit.title") },
            ]}
            actions={
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  form="edit-driver-form"
                  disabled={mutation.isPending}
                  className="inline-flex h-10 items-center rounded-xl bg-brand-gradient px-4 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:opacity-60"
                >
                  {mutation.isPending ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {t("pages.driverForm.savingButton")}
                    </>
                  ) : (
                    t("pages.users.saveChangesButton")
                  )}
                </button>
                <Link
                  to="/drivers"
                  className="inline-flex h-10 items-center rounded-xl border border-border/80 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  {t("common.cancel")}
                </Link>
              </div>
            }
            className="border-0 bg-transparent px-0 py-4 sm:py-5 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight"
          />
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:px-8">
        <form id="edit-driver-form" onSubmit={onSubmit} className="space-y-4">
          <SectionCard title={t("pages.driverForm.personalInfoTitle")} description={t("pages.driverForm.personalInfoDesc")}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>{t("pages.driverForm.firstNameRequiredLabel")}</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t("pages.driverForm.lastNameRequiredLabel")}</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t("pages.users.emailLabel")}</label>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email ?? ""}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t("pages.driverForm.phoneRequiredLabel")}</label>
                <input
                  type="tel"
                  required
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t("pages.driverForm.dateOfBirthLabel")}</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.dateOfBirth ?? ""}
                  onChange={(e) => update("dateOfBirth", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{t("pages.invoiceDetail.addressLabel")}</label>
                <textarea
                  rows={3}
                  className="w-full resize-y rounded-xl border border-border/80 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                  value={form.address ?? ""}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title={t("pages.driverForm.licenseInfoTitle")} description={t("pages.driverForm.licenseInfoDesc")}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>{t("pages.driverForm.licenseNumberLabel")}</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.licenseNumber ?? ""}
                  onChange={(e) => update("licenseNumber", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t("pages.driverForm.licenseExpiryLabel")}</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.licenseExpiry ?? ""}
                  onChange={(e) => update("licenseExpiry", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t("pages.driverForm.licenseClassLabel")}</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.licenseClass ?? ""}
                  onChange={(e) => update("licenseClass", e.target.value)}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title={t("pages.driverForm.employmentCommissionTitle")} description={t("pages.driverForm.employmentCommissionDesc")}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className={labelClass}>{t("pages.driverForm.hireDateLabel")}</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.hireDate ?? ""}
                    onChange={(e) => update("hireDate", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("common.status")}</label>
                  <select
                    className={inputClass}
                    value={form.employmentStatus ?? "active"}
                    onChange={(e) =>
                      update("employmentStatus", e.target.value as "active" | "suspended" | "terminated")
                    }
                  >
                    {EMPLOYMENT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>{t("pages.driverForm.subcontractorOptionalLabel")}</label>
                  <select
                    className={inputClass}
                    value={form.subcontractorId ?? ""}
                    onChange={(e) => update("subcontractorId", e.target.value)}
                  >
                    <option value="">{t("pages.driverForm.noneDirectShortOption")}</option>
                    {(subsQ.data ?? [])
                      .filter((s) => s.status === "active")
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.legal_name}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {t("pages.driverForm.subManagedHintShort")}
                  </p>
                </div>
              </div>
              <div className="rounded-[14px] border border-border/70 bg-slate-50/70 p-4">
                <CommissionInput
                  commissionType={form.commissionType ?? "percentage"}
                  commissionRate={form.commissionRate ?? 10}
                  fixedCommissionAmount={form.fixedCommissionAmount ?? 0}
                  minimumCommission={form.minimumCommission ?? 0}
                  onChange={(values) => {
                    if (values.commissionType != null) update("commissionType", values.commissionType);
                    if (values.commissionRate != null) update("commissionRate", values.commissionRate);
                    if (values.fixedCommissionAmount != null)
                      update("fixedCommissionAmount", values.fixedCommissionAmount);
                    if (values.minimumCommission != null) update("minimumCommission", values.minimumCommission);
                  }}
                  errors={commissionErrors}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title={t("pages.driverForm.platformIdsTitle")} description={t("pages.driverForm.platformIdsDesc")}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>{t("pages.driverForm.driverIdSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.UBER] })}</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.uberDriverId ?? ""}
                  onChange={(e) => update("uberDriverId", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t("pages.driverForm.driverIdSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.BOLT] })}</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.boltDriverId ?? ""}
                  onChange={(e) => update("boltDriverId", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t("pages.driverForm.courierIdSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.GLOVO] })}</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.glovoCourierId ?? ""}
                  onChange={(e) => update("glovoCourierId", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t("pages.driverForm.platformIdSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.BOLT_COURIER] })}</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.boltCourierId ?? ""}
                  onChange={(e) => update("boltCourierId", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t("pages.driverForm.driverUuidSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.BOLT_TAXI] })}</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.boltTaxiDriverUuid ?? ""}
                  onChange={(e) => update("boltTaxiDriverUuid", e.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
              </div>
              <div>
                <label className={labelClass}>{t("pages.driverForm.courierIdSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.WOLT] })}</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.woltCourierId ?? ""}
                  onChange={(e) => update("woltCourierId", e.target.value)}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title={t("pages.invoiceDetail.notesLabel")} description={t("pages.driverForm.notesDesc")}>
            <textarea
              rows={4}
              className="w-full resize-y rounded-xl border border-border/80 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              value={form.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
              placeholder={t("pages.driverForm.notesPlaceholder")}
            />
          </SectionCard>

          {(formError || mutation.isError) && (
            <div className="rounded-[14px] border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError || (mutation.error as Error).message || t("pages.driverForm.failedToUpdateDriver")}
            </div>
          )}

          {id && (
            <SectionCard title={t("pages.driverForm.documentsTitle")} description={t("pages.driverForm.documentsDesc")}>
              <div className="space-y-6">
                <div className="rounded-[14px] border border-border/70 bg-slate-50/60 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">{t("pages.driverForm.uploadDocumentTitle")}</h3>
                  <p className="mb-3 text-xs text-slate-500">
                    {t("pages.driverForm.uploadDocumentDesc")}
                  </p>
                  <DocumentUpload driverId={id} />
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">{t("pages.driverForm.uploadedDocumentsTitle")}</h3>
                  <DocumentList driverId={id} />
                </div>
              </div>
            </SectionCard>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex h-11 items-center rounded-xl bg-brand-gradient px-5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:opacity-60"
            >
              {mutation.isPending ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t("pages.driverForm.savingButton")}
                </>
              ) : (
                t("pages.users.saveChangesButton")
              )}
            </button>
            <Link
              to="/drivers"
              className="inline-flex h-11 items-center rounded-xl border border-border/80 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {t("common.cancel")}
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
