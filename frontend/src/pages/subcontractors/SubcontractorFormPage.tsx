import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createSubcontractor,
  getSubcontractor,
  updateSubcontractor,
  type SaveSubcontractorPayload,
  type SubcontractorLinkedDriver,
  type SubcontractorRegistrationType,
} from "../../api/subcontractors";
import { LinkedDriverPlatformIds } from "../../components/subcontractors/LinkedDriverPlatformIds";
import { platformIdsSearchText } from "../../components/subcontractors/linkedDriverPlatformIdUtils";
import { PageHeader } from "../../components/theme/PageHeader";

const inputClass =
  "h-11 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";
const textareaClass =
  "w-full rounded-xl border border-border/80 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-b border-border/60 pb-5 last:border-0 last:pb-0">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function driverInitials(firstName: string, lastName: string): string {
  const f = firstName.trim().charAt(0);
  const l = lastName.trim().charAt(0);
  return `${f}${l}`.toUpperCase() || "?";
}

function LinkedDriversPanel({ drivers }: { drivers: SubcontractorLinkedDriver[] }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");

  const filtered = drivers.filter((d) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return `${d.first_name} ${d.last_name} ${d.phone} ${platformIdsSearchText(d)}`
      .toLowerCase()
      .includes(q);
  });

  return (
    <aside className="rounded-[16px] border border-border/70 bg-white p-4 shadow-soft sm:p-5 lg:sticky lg:top-4 lg:self-start">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{t("pages.subcontractorDetail.linkedDriversTitle")}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{t("pages.subcontractorForm.linkedDriversPanelDesc")}</p>
        </div>
        <span className="inline-flex h-6 items-center rounded-full bg-slate-100 px-2.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
          {drivers.length}
        </span>
      </div>

      {drivers.length > 4 && (
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t("pages.subcontractorForm.searchDriversPlaceholder")}
          className={`${inputClass} mb-3`}
        />
      )}

      <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-0.5">
        {filtered.map((d) => (
          <li key={d.id}>
            <Link
              to={`/drivers/${d.id}`}
              className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-slate-50/60 px-3 py-2.5 transition-all duration-200 hover:border-brand/30 hover:bg-brand-mint/15"
            >
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-mint text-xs font-semibold text-brand">
                {driverInitials(d.first_name, d.last_name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900">
                  {d.first_name} {d.last_name}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {d.phone || t("pages.subcontractorForm.noPhoneFallback")}
                </span>
                <LinkedDriverPlatformIds driver={d} />
              </span>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-dashed border-border/80 px-3 py-6 text-center text-sm text-slate-500">
            {t("pages.subcontractorForm.noDriversMatchSearch")}
          </li>
        )}
      </ul>
    </aside>
  );
}

export function SubcontractorFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [err, setErr] = useState<string | null>(null);

  const detailQ = useQuery({
    queryKey: ["subcontractors", id],
    queryFn: () => getSubcontractor(id!).then((r) => r.data),
    enabled: !isNew && !!id,
  });

  const [form, setForm] = useState({
    legalName: "",
    registrationType: "srl" as SubcontractorRegistrationType,
    registrationNumber: "",
    taxId: "",
    email: "",
    phone: "",
    address: "",
    bankName: "",
    bankAccountIban: "",
    status: "active",
    contractStartDate: "",
    contractEndDate: "",
    notes: "",
  });

  useEffect(() => {
    const d = detailQ.data;
    if (!d) return;
    setForm({
      legalName: d.legal_name,
      registrationType: (d.registration_type as SubcontractorRegistrationType) || "srl",
      registrationNumber: d.registration_number ?? "",
      taxId: d.tax_id ?? "",
      email: d.email ?? "",
      phone: d.phone ?? "",
      address: d.address ?? "",
      bankName: d.bank_name ?? "",
      bankAccountIban: d.bank_account_iban ?? "",
      status: d.status,
      contractStartDate: d.contract_start_date?.slice(0, 10) ?? "",
      contractEndDate: d.contract_end_date?.slice(0, 10) ?? "",
      notes: d.notes ?? "",
    });
  }, [detailQ.data]);

  const saveMut = useMutation({
    mutationFn: async (body: SaveSubcontractorPayload) => {
      if (isNew) return createSubcontractor(body).then((r) => r.data);
      return updateSubcontractor(id!, body).then((r) => r.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subcontractors"] });
      navigate("/subcontractors");
    },
    onError: (e: unknown) => setErr(e instanceof Error ? e.message : t("pages.subcontractorForm.saveFailedError")),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.legalName.trim()) {
      setErr(t("pages.subcontractorForm.legalNameRequiredError"));
      return;
    }
    const body: SaveSubcontractorPayload = {
      legalName: form.legalName.trim(),
      registrationType: form.registrationType,
      registrationNumber: form.registrationNumber.trim() || null,
      taxId: form.taxId.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      bankName: form.bankName.trim() || null,
      bankAccountIban: form.bankAccountIban.trim() || null,
      status: form.status,
      contractStartDate: form.contractStartDate.trim() || null,
      contractEndDate: form.contractEndDate.trim() || null,
      notes: form.notes.trim() || null,
    };
    saveMut.mutate(body);
  };

  const linkedDrivers = detailQ.data?.drivers ?? [];
  const showForm = isNew || detailQ.data;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-100">
      <div className="shrink-0 border-b border-border/60 bg-surface-card/90 backdrop-blur-md">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <PageHeader
            title={isNew ? t("pages.subcontractorForm.createTitle") : t("pages.subcontractorForm.editTitle")}
            description={
              isNew
                ? t("pages.subcontractorForm.createSubtitle")
                : t("pages.subcontractorForm.editSubtitle")
            }
            breadcrumbs={[
              { label: t("nav.dashboard"), to: "/dashboard" },
              { label: t("nav.subcontractors"), to: "/subcontractors" },
              { label: isNew ? t("pages.subcontractorForm.newLabel") : t("pages.subcontractorForm.editLabel") },
            ]}
            className="border-0 bg-transparent px-0 py-4 sm:py-5 [&_nav]:mb-1.5 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:tracking-tight [&_h1]:text-slate-900"
          />
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1200px] flex-1 p-4 sm:p-6">
        {!isNew && detailQ.isLoading && (
          <p className="text-sm text-slate-500">{t("pages.subcontractorDetail.loadingSubcontractor")}</p>
        )}
        {err && (
          <div className="mb-4 rounded-[14px] border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800">
            {err}
          </div>
        )}
        {!isNew && detailQ.isError && (
          <p className="mb-4 text-sm text-red-700">{t("pages.subcontractorDetail.couldNotLoadSubcontractor")}</p>
        )}

        {showForm && (
          <div
            className={`grid gap-4 ${!isNew && linkedDrivers.length > 0 ? "lg:grid-cols-[1fr_320px]" : ""}`}
          >
            <form
              onSubmit={onSubmit}
              className="rounded-[16px] border border-border/70 bg-white p-5 shadow-soft sm:p-6"
            >
              <FormSection title={t("pages.subcontractorDetail.businessInfoTitle")} description={t("pages.subcontractorForm.businessInfoDesc")}>
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>{t("pages.subcontractorDetail.legalNameLabel")}</label>
                    <input
                      required
                      className={inputClass}
                      value={form.legalName}
                      onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>{t("pages.subcontractorDetail.registrationTypeLabel")}</label>
                      <select
                        className={inputClass}
                        value={form.registrationType}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            registrationType: e.target.value as SubcontractorRegistrationType,
                          }))
                        }
                      >
                        <option value="srl">{t("pages.subcontractorForm.srlOption")}</option>
                        <option value="sa">{t("pages.subcontractorForm.saOption")}</option>
                        <option value="other">{t("pages.subcontractorForm.otherOption")}</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>{t("common.status")}</label>
                      <select
                        className={inputClass}
                        value={form.status}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      >
                        <option value="active">{t("status.active")}</option>
                        <option value="inactive">{t("status.inactive")}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>{t("pages.subcontractorDetail.registrationNumberLabel")}</label>
                      <input
                        className={inputClass}
                        value={form.registrationNumber}
                        onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("pages.subcontractorDetail.taxIdLabel")}</label>
                      <input
                        className={inputClass}
                        value={form.taxId}
                        onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              <FormSection title={t("pages.subcontractorForm.contactInfoTitle")} description={t("pages.subcontractorForm.contactInfoDesc")}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>{t("pages.users.emailLabel")}</label>
                    <input
                      type="email"
                      className={inputClass}
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("pages.invoiceForm.phoneLabel")}</label>
                    <input
                      className={inputClass}
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelClass}>{t("pages.invoiceDetail.addressLabel")}</label>
                  <textarea
                    className={textareaClass}
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
              </FormSection>

              <FormSection title={t("pages.subcontractorForm.bankingInfoTitle")} description={t("pages.subcontractorForm.bankingInfoDesc")}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>{t("pages.invoiceForm.bankNameLabel")}</label>
                    <input
                      className={inputClass}
                      value={form.bankName}
                      onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("pages.invoiceForm.ibanLabel")}</label>
                    <input
                      className={inputClass}
                      value={form.bankAccountIban}
                      onChange={(e) => setForm((f) => ({ ...f, bankAccountIban: e.target.value }))}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title={t("pages.subcontractorForm.contractDetailsTitle")} description={t("pages.subcontractorForm.contractDetailsDesc")}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>{t("pages.subcontractorForm.contractStartLabel")}</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={form.contractStartDate}
                      onChange={(e) => setForm((f) => ({ ...f, contractStartDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("pages.subcontractorForm.contractEndLabel")}</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={form.contractEndDate}
                      onChange={(e) => setForm((f) => ({ ...f, contractEndDate: e.target.value }))}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title={t("pages.invoiceDetail.notesLabel")} description={t("pages.subcontractorForm.notesDesc")}>
                <textarea
                  className={textareaClass}
                  rows={4}
                  placeholder={t("pages.subcontractorForm.notesPlaceholder")}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </FormSection>

              <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-5">
                <button
                  type="submit"
                  disabled={saveMut.isPending}
                  className="inline-flex h-11 items-center rounded-xl bg-brand-gradient px-5 text-sm font-medium text-white shadow-sm hover:opacity-95 hover:shadow-md disabled:opacity-50"
                >
                  {saveMut.isPending
                    ? t("common.saving")
                    : isNew
                      ? t("pages.subcontractorForm.createSubcontractorButton")
                      : t("pages.users.saveChangesButton")}
                </button>
                <Link
                  to="/subcontractors"
                  className="inline-flex h-11 items-center rounded-xl border border-border/80 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  {t("common.cancel")}
                </Link>
              </div>
            </form>

            {!isNew && linkedDrivers.length > 0 && <LinkedDriversPanel drivers={linkedDrivers} />}
          </div>
        )}
      </main>
    </div>
  );
}
