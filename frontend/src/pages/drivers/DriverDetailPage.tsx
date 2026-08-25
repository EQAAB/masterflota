import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getDriverDetail,
  updateDriverNotes,
  deleteDriver,
  getDriverActivity,
  uploadDriverPhoto,
  type Driver,
  type DriverActivity,
} from "../../api/driverDetail";
import {
  PLATFORM_IDS,
  PLATFORM_ID_LABELS,
} from "../../constants/platformIds";
import { DriverAvatar } from "../../components/drivers/DriverAvatar";
import { usePermission, useCanViewPayouts } from "../../lib/permissions";
import type { VehicleListItem } from "../../api/vehicles";
import { assignVehicleToDriver, unassignDriverVehicle } from "../../api/vehicleAssignments";
import { VehicleSearchCombobox } from "../../components/vehicles/VehicleSearchCombobox";
import { DocumentUpload } from "../../components/documents/DocumentUpload";
import { DocumentList } from "../../components/documents/DocumentList";
import { VehicleAssignmentHistoryPanel } from "../../components/vehicles/VehicleAssignmentHistoryPanel";
import { DriverRecurringFeesPanel } from "../../components/drivers/DriverRecurringFeesPanel";
import { DriverLoanSummaryCard } from "../../components/earnings/loans/DriverLoanSummaryCard";

type TabId = "profile" | "documents" | "activity";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = value.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/70",
  suspended: "bg-amber-100 text-amber-800 ring-1 ring-amber-200/70",
  terminated: "bg-red-100 text-red-800 ring-1 ring-red-200/70",
};

const cardClass = "bg-white rounded-[16px] border border-border/70 shadow-soft p-4 sm:p-5";
const sectionTitleClass = "text-sm font-semibold text-ink mb-3";

type ActivityTone = "add" | "remove" | "update" | "status" | "default";

function relativeDateLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startInput = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startToday.getTime() - startInput.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return formatDate(value);
}

function activityTone(type: string): ActivityTone {
  if (type.includes("create") || type.includes("upload")) return "add";
  if (type.includes("delete") || type.includes("remove")) return "remove";
  if (type.includes("status")) return "status";
  if (type.includes("update") || type.includes("verify")) return "update";
  return "default";
}

function ActivityIcon({ type }: { type: string }) {
  const tone = activityTone(type);
  const toneClass =
    tone === "add"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "remove"
        ? "bg-rose-100 text-rose-700"
        : tone === "status"
          ? "bg-violet-100 text-violet-700"
          : tone === "update"
            ? "bg-sky-100 text-sky-700"
            : "bg-slate-100 text-slate-600";

  const IconPath =
    tone === "add"
      ? "M12 4.5v15m7.5-7.5h-15"
      : tone === "remove"
        ? "M5 12h14"
        : tone === "status"
          ? "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          : "M12 6v6l4 2";

  return (
    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
      <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d={IconPath} />
      </svg>
    </span>
  );
}

export function DriverDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>("profile");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notesEdit, setNotesEdit] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleListItem | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const ACTIVITY_LABELS: Record<string, string> = {
    profile_update: t("pages.driverDetail.activityProfileUpdate"),
    profile_photo_update: t("pages.driverDetail.activityProfilePhotoUpdate"),
    status_change: t("pages.driverDetail.activityStatusChange"),
    document_upload: t("pages.driverDetail.activityDocumentUpload"),
    document_verify: t("pages.driverDetail.activityDocumentVerify"),
    document_delete: t("pages.driverDetail.activityDocumentDelete"),
    driver_delete: t("pages.driverDetail.activityDriverDelete"),
    notes_update: t("pages.driverDetail.activityNotesUpdate"),
    recurring_fee_create: t("pages.driverDetail.activityRecurringFeeCreate"),
    recurring_fee_update: t("pages.driverDetail.activityRecurringFeeUpdate"),
    recurring_fee_delete: t("pages.driverDetail.activityRecurringFeeDelete"),
  };

  const { data: driverRes, isLoading: loadingDriver, isError: driverError } = useQuery({
    queryKey: ["driver", id],
    queryFn: () => getDriverDetail(id!),
    enabled: !!id,
  });

  const { data: activityRes, isLoading: loadingActivity } = useQuery({
    queryKey: ["driverActivity", id],
    queryFn: () => getDriverActivity(id!),
    enabled: !!id && tab === "activity",
  });

  const driver = driverRes?.data;
  const activities = activityRes?.data ?? [];

  const notesMutation = useMutation({
    mutationFn: (notes: string | null) => updateDriverNotes(id!, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver", id] });
      queryClient.invalidateQueries({ queryKey: ["driverActivity", id] });
      setNotesEdit(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDriver(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setDeleteModalOpen(false);
      navigate("/drivers");
    },
  });

  const assignMutation = useMutation({
    mutationFn: (vehicleId: string) => assignVehicleToDriver(id!, vehicleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["driver", id] });
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      void queryClient.invalidateQueries({ queryKey: ["vehicle-assignment-history"] });
      setAssignOpen(false);
      setSelectedVehicle(null);
    },
  });

  const unassignMutation = useMutation({
    mutationFn: () => unassignDriverVehicle(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["driver", id] });
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      void queryClient.invalidateQueries({ queryKey: ["vehicle-assignment-history"] });
    },
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => uploadDriverPhoto(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver", id] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      if (photoInputRef.current) photoInputRef.current.value = "";
    },
  });

  const canEdit = usePermission("drivers.edit");
  const canDelete = usePermission("drivers.delete");
  const canAssignVehicle = usePermission("drivers.assign_vehicle");
  const canViewDriver = usePermission("drivers.view");
  const canViewPayouts = useCanViewPayouts();

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-ink-muted">{t("pages.driverForm.missingDriverIdError")}</p>
        <Link to="/drivers" className="ml-2 text-brand hover:underline">{t("pages.driverForm.backToDrivers")}</Link>
      </div>
    );
  }

  if (loadingDriver || !driver) {
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
          <Link to="/drivers" className="mt-3 inline-block text-sm text-brand hover:underline">{t("pages.driverForm.backToDrivers")}</Link>
        </div>
      </div>
    );
  }

  const d = driver as Driver;

  return (
    <div className="min-h-full bg-slate-100">
      <header className="border-b border-border/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="inline-flex rounded-2xl bg-brand-mint/35 p-1.5 shadow-sm">
                <DriverAvatar
                  driverId={d.id}
                  profilePhotoUrl={d.profile_photo_url}
                  firstName={d.first_name}
                  lastName={d.last_name}
                  size="lg"
                  className="h-24 w-24 text-xl shadow-sm"
                />
              </div>
              {canEdit && (
                <div className="mt-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) photoMutation.mutate(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={photoMutation.isPending}
                    className="text-xs text-brand hover:text-brand-dark font-medium disabled:opacity-60"
                  >
                    {photoMutation.isPending ? t("pages.driverDetail.uploadingButton") : t("pages.driverDetail.changePhotoButton")}
                  </button>
                </div>
              )}
            </div>
            <div className="pt-0.5">
              <div className="flex items-center gap-3">
                <Link to="/drivers" className="text-sm text-ink-muted hover:text-ink">
                  ← {t("pages.driverForm.backToDrivers")}
                </Link>
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                {d.first_name} {d.last_name}
              </h1>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {t("pages.driverDetail.driverIdLabel")} <span className="font-mono">{id}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {canEdit && (
              <Link
                to={`/drivers/${id}/edit`}
                className="inline-flex h-10 items-center rounded-xl bg-brand-gradient px-4 text-sm font-medium text-white shadow-sm hover:opacity-95 hover:shadow-md"
              >
                {t("pages.driverDetail.edit")}
              </Link>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="inline-flex h-10 items-center rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
              >
                {t("pages.driverDetail.deleteDriverButton")}
              </button>
            )}
          </div>
        </div>

        <nav className="mx-auto mt-2 flex max-w-[1600px] gap-2 px-4 pb-3 sm:px-6 lg:px-8">
          {(["profile", "documents", "activity"] as TabId[]).map((tabId) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setTab(tabId)}
              className={`rounded-full px-4 py-2.5 text-sm font-medium capitalize transition-all duration-200 ${
                tab === tabId
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-border/70"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
              }`}
            >
              {t(`pages.driverDetail.${tabId}`)}
            </button>
          ))}
        </nav>
      </header>

      <main className={`mx-auto p-4 sm:p-6 ${tab === "activity" ? "max-w-5xl" : "max-w-4xl"}`}>
        {tab === "profile" && (
          <div className="space-y-4">
            <section className={cardClass}>
              <h2 className={sectionTitleClass}>{t("pages.driverForm.personalInfoTitle")}</h2>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-sm md:grid-cols-2">
                <div><dt className="text-xs font-medium text-slate-500">{t("pages.driverDetail.firstNameLabel")}</dt><dd className="mt-0.5 font-medium text-slate-900">{d.first_name ?? "—"}</dd></div>
                <div><dt className="text-xs font-medium text-slate-500">{t("pages.driverDetail.lastNameLabel")}</dt><dd className="mt-0.5 font-medium text-slate-900">{d.last_name ?? "—"}</dd></div>
                <div><dt className="text-xs font-medium text-slate-500">{t("pages.users.emailLabel")}</dt><dd className="mt-0.5 text-slate-900">{d.email ?? "—"}</dd></div>
                <div><dt className="text-xs font-medium text-slate-500">{t("pages.invoiceForm.phoneLabel")}</dt><dd className="mt-0.5 text-slate-900">{d.phone ?? "—"}</dd></div>
                <div><dt className="text-xs font-medium text-slate-500">{t("pages.driverForm.dateOfBirthLabel")}</dt><dd className="mt-0.5 text-slate-900">{formatDate(d.date_of_birth)}</dd></div>
                <div className="md:col-span-2"><dt className="text-xs font-medium text-slate-500">{t("pages.invoiceDetail.addressLabel")}</dt><dd className="mt-0.5 text-slate-900">{d.address ?? "—"}</dd></div>
              </dl>
            </section>

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>{t("pages.driverForm.licenseInfoTitle")}</h2>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-sm md:grid-cols-2">
                <div><dt className="text-xs font-medium text-slate-500">{t("pages.driverForm.licenseNumberLabel")}</dt><dd className="mt-0.5 text-slate-900">{d.license_number ?? "—"}</dd></div>
                <div><dt className="text-xs font-medium text-slate-500">{t("pages.driverForm.licenseExpiryLabel")}</dt><dd className="mt-0.5 text-slate-900">{formatDate(d.license_expiry)}</dd></div>
                <div><dt className="text-xs font-medium text-slate-500">{t("pages.driverForm.licenseClassLabel")}</dt><dd className="mt-0.5 text-slate-900">{d.license_class ?? "—"}</dd></div>
              </dl>
            </section>

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>{t("pages.driverForm.employmentTitle")}</h2>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-sm md:grid-cols-2">
                <div><dt className="text-xs font-medium text-slate-500">{t("pages.driverForm.hireDateLabel")}</dt><dd className="mt-0.5 text-slate-900">{formatDate(d.hire_date)}</dd></div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">{t("common.status")}</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-medium capitalize ${STATUS_COLORS[d.employment_status] ?? "bg-slate-100 text-ink ring-1 ring-slate-200/70"}`}>
                      {t(`driverStatus.${d.employment_status}`, d.employment_status)}
                    </span>
                  </dd>
                </div>
                <div><dt className="text-xs font-medium text-slate-500">{t("pages.driverDetail.commissionRateLabel")}</dt><dd className="mt-0.5 text-slate-900">{d.commission_rate ?? "—"}%</dd></div>
                <div className="md:col-span-2">
                  <dt className="text-xs font-medium text-slate-500">{t("pages.driverDetail.subcontractorLabel")}</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {d.subcontractor_id && d.subcontractor_legal_name ? (
                      <>
                        <Link
                          to={`/subcontractors/${d.subcontractor_id}`}
                          className="font-medium text-brand hover:text-brand-dark"
                        >
                          {d.subcontractor_legal_name}
                        </Link>
                      </>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>{t("pages.driverForm.platformIdsTitle")}</h2>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    {t("pages.driverForm.driverIdSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.UBER] })}
                  </dt>
                  <dd className="mt-0.5 text-slate-900">{d.uber_driver_id ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    {t("pages.driverForm.driverIdSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.BOLT] })}
                  </dt>
                  <dd className="mt-0.5 text-slate-900">{d.bolt_driver_id ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    {t("pages.driverForm.courierIdSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.GLOVO] })}
                  </dt>
                  <dd className="mt-0.5 text-slate-900">{d.glovo_courier_id ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    {t("pages.driverForm.platformIdSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.BOLT_COURIER] })}
                  </dt>
                  <dd className="mt-0.5 text-slate-900">{d.bolt_courier_id ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    {t("pages.driverForm.driverUuidSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.BOLT_TAXI] })}
                  </dt>
                  <dd className="mt-0.5 font-mono text-sm text-slate-900">{d.bolt_taxi_driver_uuid ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    {t("pages.driverForm.courierIdSuffix", { platform: PLATFORM_ID_LABELS[PLATFORM_IDS.WOLT] })}
                  </dt>
                  <dd className="mt-0.5 text-slate-900">{d.wolt_courier_id ?? "—"}</dd>
                </div>
              </dl>
            </section>

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>{t("pages.driverDetail.currentVehicleTitle")}</h2>
              {d.current_vehicle_id ? (
                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    to={`/vehicles/${d.current_vehicle_id}`}
                    className="font-medium text-brand hover:text-brand-dark"
                  >
                    {d.current_vehicle_year != null ? `${d.current_vehicle_year} ` : ""}
                    {d.current_vehicle_make ?? ""} {d.current_vehicle_model ?? ""}
                    {d.current_vehicle_license_plate ? ` (${d.current_vehicle_license_plate})` : ""}
                  </Link>
                  {canAssignVehicle && (
                    <button
                      type="button"
                      onClick={() => unassignMutation.mutate()}
                      disabled={unassignMutation.isPending}
                      className="inline-flex h-8 items-center rounded-lg border border-border/80 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {t("pages.driverDetail.unassignVehicleButton")}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-sm text-ink-muted">{t("pages.driverDetail.noVehicleAssigned")}</p>
                  {canAssignVehicle && (
                    <button
                      type="button"
                      onClick={() => setAssignOpen(true)}
                      className="inline-flex h-8 items-center rounded-lg bg-brand-gradient px-3 text-xs font-medium text-white hover:opacity-95"
                    >
                      {t("pages.driverDetail.assignVehicleButton")}
                    </button>
                  )}
                </div>
              )}
            </section>

            {canViewDriver && id && (
              <VehicleAssignmentHistoryPanel mode="driver" entityId={id} title={t("pages.driverDetail.vehicleHistoryTitle")} />
            )}

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>{t("pages.invoiceDetail.notesLabel")}</h2>
              {!notesEdit ? (
                <div className="flex items-start justify-between gap-2">
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{d.notes || t("pages.driverDetail.noNotesFallback")}</p>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setNotesValue(d.notes ?? "");
                        setNotesEdit(true);
                      }}
                      className="text-sm text-brand hover:underline shrink-0"
                    >
                      {t("pages.driverDetail.editNotesButton")}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-border/80 px-3 py-2.5 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                  />
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => notesMutation.mutate(notesValue.trim() || null)}
                      disabled={notesMutation.isPending}
                      className="inline-flex h-9 items-center rounded-lg bg-brand-gradient px-3.5 text-sm text-white hover:opacity-95 disabled:opacity-60"
                    >
                      {t("common.save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNotesEdit(false); setNotesValue(d.notes ?? ""); }}
                      className="inline-flex h-9 items-center rounded-lg border border-border/80 px-3.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {id && <DriverRecurringFeesPanel driverId={id} canEdit={canEdit} />}

            {id && canViewDriver && (
              <DriverLoanSummaryCard
                driverId={id}
                driverFirstName={d.first_name}
                driverLastName={d.last_name}
              />
            )}

            {canViewPayouts && (
            <section className={cardClass}>
              <h2 className={sectionTitleClass}>{t("pages.driverDetail.payoutHistoryTitle")}</h2>
              <p className="mb-2 text-sm text-slate-600">
                {t("pages.driverDetail.payoutHistoryDesc")}
              </p>
              <Link
                to={`/earnings/payouts?driverId=${encodeURIComponent(id)}`}
                className="text-sm text-brand hover:underline font-medium"
              >
                {t("pages.driverDetail.openPayoutsLink")}
              </Link>
            </section>
            )}

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>{t("pages.driverDetail.metadataTitle")}</h2>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-sm md:grid-cols-2">
                <div><dt className="text-xs font-medium text-slate-500">{t("pages.driverDetail.createdLabel")}</dt><dd className="mt-0.5 text-slate-900">{formatDate(d.created_at)}</dd></div>
                <div><dt className="text-xs font-medium text-slate-500">{t("pages.driverDetail.lastUpdatedLabel")}</dt><dd className="mt-0.5 text-slate-900">{formatDate(d.updated_at)}</dd></div>
              </dl>
            </section>
          </div>
        )}

        {tab === "documents" && (
          <div className="space-y-4">
            {canEdit && (
              <div className={cardClass}>
                <h2 className={sectionTitleClass}>{t("pages.driverDetail.uploadNewDocumentTitle")}</h2>
                <DocumentUpload driverId={id} />
              </div>
            )}
            <div className={cardClass}>
              <h2 className={sectionTitleClass}>{t("pages.driverDetail.documents")}</h2>
              <DocumentList driverId={id} canEdit={canEdit} />
            </div>
          </div>
        )}

        {tab === "activity" && (
          <div className={`${cardClass} min-h-[360px]`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">{t("pages.driverDetail.activityHistoryTitle")}</h2>
              <span className="inline-flex h-7 items-center rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
                {t("pages.driverDetail.eventCount", { count: activities.length })}
              </span>
            </div>
            {loadingActivity ? (
              <p className="text-sm text-ink-muted">{t("pages.driverDetail.loadingEllipsis")}</p>
            ) : activities.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-border/80 bg-brand-mint/10 px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-800">{t("pages.driverDetail.noActivityYetTitle")}</p>
                <p className="mt-1 text-sm text-slate-500">{t("pages.driverDetail.noActivityYetDesc")}</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {activities.map((a: DriverActivity, index: number) => (
                  <li
                    key={a.id}
                    className="group rounded-[12px] border border-transparent px-2.5 py-2 transition-all duration-200 hover:border-border/70 hover:bg-slate-50/80"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex shrink-0 flex-col items-center">
                        <ActivityIcon type={a.activity_type} />
                        {index < activities.length - 1 && (
                          <span className="mt-1 h-8 w-px bg-slate-200" aria-hidden />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-start gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {ACTIVITY_LABELS[a.activity_type] ?? a.activity_type}
                          </p>
                          <span className="ml-auto inline-flex h-6 items-center rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/80">
                            {relativeDateLabel(a.created_at)}
                          </span>
                        </div>
                        {a.activity_description && (
                          <p className="mt-1 text-sm text-slate-600">{a.activity_description}</p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">{formatDate(a.created_at)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>

      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-ink">{t("pages.driverDetail.deleteDriverModalTitle")}</h3>
            <p className="text-sm text-ink-muted mt-2">
              {t("pages.driverDetail.deleteDriverModalDesc")}
            </p>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending ? t("pages.driverDetail.deletingButton") : t("pages.driverDetail.deleteButton")}
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteMutation.isPending}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-ink">{t("pages.driverDetail.assignVehicleModalTitle")}</h3>
            <p className="text-sm text-ink-muted mt-1">{t("pages.driverDetail.assignVehicleModalDesc")}</p>
            <div className="mt-4">
              <VehicleSearchCombobox
                value={selectedVehicle}
                onChange={setSelectedVehicle}
                currentDriverId={id}
                hideLabel
                disabled={assignMutation.isPending}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                disabled={!selectedVehicle || assignMutation.isPending}
                onClick={() => assignMutation.mutate(selectedVehicle!.id)}
                className="rounded-md bg-brand-gradient px-3 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
              >
                {assignMutation.isPending ? t("pages.driverDetail.assigningButton") : t("pages.driverDetail.assignButton")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignOpen(false);
                  setSelectedVehicle(null);
                }}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
