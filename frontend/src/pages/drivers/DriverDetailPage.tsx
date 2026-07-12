import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { usePermission } from "../../lib/permissions";
import { getVehicles, type VehicleListItem } from "../../api/vehicles";
import { assignVehicleToDriver, unassignDriverVehicle } from "../../api/vehicleAssignments";
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

const ACTIVITY_LABELS: Record<string, string> = {
  profile_update: "Profile updated",
  profile_photo_update: "Profile photo updated",
  status_change: "Status changed",
  document_upload: "Document uploaded",
  document_verify: "Document verified",
  document_delete: "Document deleted",
  driver_delete: "Driver deleted",
  notes_update: "Notes updated",
  recurring_fee_create: "Recurring fee added",
  recurring_fee_update: "Recurring fee updated",
  recurring_fee_delete: "Recurring fee removed",
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>("profile");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notesEdit, setNotesEdit] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  const { data: vehiclesRes } = useQuery({
    queryKey: ["vehicles", "for-assign"],
    queryFn: () => getVehicles({ limit: 500 }),
    enabled: assignOpen && !!id,
  });

  const driver = driverRes?.data;
  const activities = activityRes?.data ?? [];
  const vehiclesForAssign = (vehiclesRes?.data?.data ?? []).filter(
    (v: VehicleListItem) => v.status !== "sold" && v.status !== "scrapped",
  );

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
      setSelectedVehicleId("");
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

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-ink-muted">Missing driver ID.</p>
        <Link to="/drivers" className="ml-2 text-brand hover:underline">Back to drivers</Link>
      </div>
    );
  }

  if (loadingDriver || !driver) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-block w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink-muted">Loading driver...</p>
        </div>
      </div>
    );
  }

  if (driverError) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-md">
          <p className="text-red-600">Failed to load driver.</p>
          <Link to="/drivers" className="mt-3 inline-block text-sm text-brand hover:underline">Back to drivers</Link>
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
                    {photoMutation.isPending ? "Uploading..." : "Change photo"}
                  </button>
                </div>
              )}
            </div>
            <div className="pt-0.5">
              <div className="flex items-center gap-3">
                <Link to="/drivers" className="text-sm text-ink-muted hover:text-ink">
                  ← Back to drivers
                </Link>
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                {d.first_name} {d.last_name}
              </h1>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Driver ID: <span className="font-mono">{id}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {canEdit && (
              <Link
                to={`/drivers/${id}/edit`}
                className="inline-flex h-10 items-center rounded-xl bg-brand-gradient px-4 text-sm font-medium text-white shadow-sm hover:opacity-95 hover:shadow-md"
              >
                Edit driver
              </Link>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="inline-flex h-10 items-center rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
              >
                Delete driver
              </button>
            )}
          </div>
        </div>

        <nav className="mx-auto mt-2 flex max-w-[1600px] gap-2 px-4 pb-3 sm:px-6 lg:px-8">
          {(["profile", "documents", "activity"] as TabId[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2.5 text-sm font-medium capitalize transition-all duration-200 ${
                tab === t
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-border/70"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className={`mx-auto p-4 sm:p-6 ${tab === "activity" ? "max-w-5xl" : "max-w-4xl"}`}>
        {tab === "profile" && (
          <div className="space-y-4">
            <section className={cardClass}>
              <h2 className={sectionTitleClass}>Personal information</h2>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-sm md:grid-cols-2">
                <div><dt className="text-xs font-medium text-slate-500">First name</dt><dd className="mt-0.5 font-medium text-slate-900">{d.first_name ?? "—"}</dd></div>
                <div><dt className="text-xs font-medium text-slate-500">Last name</dt><dd className="mt-0.5 font-medium text-slate-900">{d.last_name ?? "—"}</dd></div>
                <div><dt className="text-xs font-medium text-slate-500">Email</dt><dd className="mt-0.5 text-slate-900">{d.email ?? "—"}</dd></div>
                <div><dt className="text-xs font-medium text-slate-500">Phone</dt><dd className="mt-0.5 text-slate-900">{d.phone ?? "—"}</dd></div>
                <div><dt className="text-xs font-medium text-slate-500">Date of birth</dt><dd className="mt-0.5 text-slate-900">{formatDate(d.date_of_birth)}</dd></div>
                <div className="md:col-span-2"><dt className="text-xs font-medium text-slate-500">Address</dt><dd className="mt-0.5 text-slate-900">{d.address ?? "—"}</dd></div>
              </dl>
            </section>

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>License information</h2>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-sm md:grid-cols-2">
                <div><dt className="text-xs font-medium text-slate-500">License number</dt><dd className="mt-0.5 text-slate-900">{d.license_number ?? "—"}</dd></div>
                <div><dt className="text-xs font-medium text-slate-500">License expiry</dt><dd className="mt-0.5 text-slate-900">{formatDate(d.license_expiry)}</dd></div>
                <div><dt className="text-xs font-medium text-slate-500">License class</dt><dd className="mt-0.5 text-slate-900">{d.license_class ?? "—"}</dd></div>
              </dl>
            </section>

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>Employment</h2>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-sm md:grid-cols-2">
                <div><dt className="text-xs font-medium text-slate-500">Hire date</dt><dd className="mt-0.5 text-slate-900">{formatDate(d.hire_date)}</dd></div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-medium capitalize ${STATUS_COLORS[d.employment_status] ?? "bg-slate-100 text-ink ring-1 ring-slate-200/70"}`}>
                      {d.employment_status}
                    </span>
                  </dd>
                </div>
                <div><dt className="text-xs font-medium text-slate-500">Commission rate</dt><dd className="mt-0.5 text-slate-900">{d.commission_rate ?? "—"}%</dd></div>
                <div className="md:col-span-2">
                  <dt className="text-xs font-medium text-slate-500">Subcontractor</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {d.subcontractor_id && d.subcontractor_legal_name ? (
                      <>
                        <Link
                          to={`/subcontractors/${d.subcontractor_id}/edit`}
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
              <h2 className={sectionTitleClass}>Platform IDs</h2>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    {PLATFORM_ID_LABELS[PLATFORM_IDS.UBER]} driver ID
                  </dt>
                  <dd className="mt-0.5 text-slate-900">{d.uber_driver_id ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    {PLATFORM_ID_LABELS[PLATFORM_IDS.BOLT]} driver ID
                  </dt>
                  <dd className="mt-0.5 text-slate-900">{d.bolt_driver_id ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    {PLATFORM_ID_LABELS[PLATFORM_IDS.GLOVO]} courier ID
                  </dt>
                  <dd className="mt-0.5 text-slate-900">{d.glovo_courier_id ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    {PLATFORM_ID_LABELS[PLATFORM_IDS.BOLT_COURIER]} ID
                  </dt>
                  <dd className="mt-0.5 text-slate-900">{d.bolt_courier_id ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    {PLATFORM_ID_LABELS[PLATFORM_IDS.BOLT_TAXI]} driver UUID
                  </dt>
                  <dd className="mt-0.5 font-mono text-sm text-slate-900">{d.bolt_taxi_driver_uuid ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">
                    {PLATFORM_ID_LABELS[PLATFORM_IDS.WOLT]} courier ID
                  </dt>
                  <dd className="mt-0.5 text-slate-900">{d.wolt_courier_id ?? "—"}</dd>
                </div>
              </dl>
            </section>

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>Current vehicle</h2>
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
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => unassignMutation.mutate()}
                      disabled={unassignMutation.isPending}
                      className="inline-flex h-8 items-center rounded-lg border border-border/80 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Unassign vehicle
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-sm text-ink-muted">No vehicle assigned.</p>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setAssignOpen(true)}
                      className="inline-flex h-8 items-center rounded-lg bg-brand-gradient px-3 text-xs font-medium text-white hover:opacity-95"
                    >
                      Assign vehicle
                    </button>
                  )}
                </div>
              )}
            </section>

            {canEdit && id && (
              <VehicleAssignmentHistoryPanel mode="driver" entityId={id} title="Vehicle history" />
            )}

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>Notes</h2>
              {!notesEdit ? (
                <div className="flex items-start justify-between gap-2">
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{d.notes || "No notes."}</p>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setNotesValue(d.notes ?? "");
                        setNotesEdit(true);
                      }}
                      className="text-sm text-brand hover:underline shrink-0"
                    >
                      Edit notes
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
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNotesEdit(false); setNotesValue(d.notes ?? ""); }}
                      className="inline-flex h-9 items-center rounded-lg border border-border/80 px-3.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>

            {id && <DriverRecurringFeesPanel driverId={id} canEdit={canEdit} />}

            {id && (
              <DriverLoanSummaryCard
                driverId={id}
                driverFirstName={d.first_name}
                driverLastName={d.last_name}
              />
            )}

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>Payout history</h2>
              <p className="mb-2 text-sm text-slate-600">
                View weekly payouts and one-off adjustments for this driver.
              </p>
              <Link
                to={`/earnings/payouts?driverId=${encodeURIComponent(id)}`}
                className="text-sm text-brand hover:underline font-medium"
              >
                Open payouts for this driver
              </Link>
            </section>

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>Metadata</h2>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-sm md:grid-cols-2">
                <div><dt className="text-xs font-medium text-slate-500">Created</dt><dd className="mt-0.5 text-slate-900">{formatDate(d.created_at)}</dd></div>
                <div><dt className="text-xs font-medium text-slate-500">Last updated</dt><dd className="mt-0.5 text-slate-900">{formatDate(d.updated_at)}</dd></div>
              </dl>
            </section>
          </div>
        )}

        {tab === "documents" && (
          <div className="space-y-4">
            {canEdit && (
              <div className={cardClass}>
                <h2 className={sectionTitleClass}>Upload new document</h2>
                <DocumentUpload driverId={id} />
              </div>
            )}
            <div className={cardClass}>
              <h2 className={sectionTitleClass}>Documents</h2>
              <DocumentList driverId={id} />
            </div>
          </div>
        )}

        {tab === "activity" && (
          <div className={`${cardClass} min-h-[360px]`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">Activity history</h2>
              <span className="inline-flex h-7 items-center rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
                {activities.length} event{activities.length === 1 ? "" : "s"}
              </span>
            </div>
            {loadingActivity ? (
              <p className="text-sm text-ink-muted">Loading...</p>
            ) : activities.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-border/80 bg-brand-mint/10 px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-800">No activity yet</p>
                <p className="mt-1 text-sm text-slate-500">Driver updates and actions will appear here.</p>
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
            <h3 className="text-lg font-semibold text-ink">Delete driver?</h3>
            <p className="text-sm text-ink-muted mt-2">
              This will soft delete the driver. They will be removed from the active list and you will no longer be able to view or edit them here.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteMutation.isPending}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-ink">Assign vehicle</h3>
            <p className="text-sm text-ink-muted mt-1">Select a vehicle for this driver.</p>
            <select
              className="mt-4 w-full rounded-md border border-border px-3 py-2 text-sm"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
            >
              <option value="">Choose vehicle…</option>
              {vehiclesForAssign.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.license_plate} — {v.make} {v.model}
                  {v.current_driver_id && v.current_driver_id !== id ? " (reassign)" : ""}
                </option>
              ))}
            </select>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                disabled={!selectedVehicleId || assignMutation.isPending}
                onClick={() => assignMutation.mutate(selectedVehicleId)}
                className="rounded-md bg-brand-gradient px-3 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
              >
                {assignMutation.isPending ? "Assigning…" : "Assign"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignOpen(false);
                  setSelectedVehicleId("");
                }}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
