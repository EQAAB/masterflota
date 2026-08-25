import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import i18n from "../../i18n";
import {
  getVehicleById,
  getVehicleMaintenance,
  createVehicleMaintenance,
  type Vehicle,
  type CreateMaintenancePayload,
} from "../../api/vehicles";
import {
  assignDriverToVehicle,
  unassignDriverFromVehicle,
} from "../../api/vehicleAssignments";
import type { DriverListItem } from "../../api/drivers";
import { DriverSearchCombobox } from "../../components/rentals/DriverSearchCombobox";
import { VehicleDocumentUpload } from "../../components/vehicles/VehicleDocumentUpload";
import { VehicleDocumentList } from "../../components/vehicles/VehicleDocumentList";
import { VehicleAssignmentHistoryPanel } from "../../components/vehicles/VehicleAssignmentHistoryPanel";
import { VehicleMaintenancePanel } from "../../components/vehicles/VehicleMaintenancePanel";
import { VehicleHistoryTimeline } from "../../components/vehicles/VehicleHistoryTimeline";
import { VehicleRentalHistoryPanel } from "../../components/rentals/VehicleRentalHistoryPanel";
import { usePermission } from "../../lib/permissions";
import { formatCurrency } from "../../utils/currency";

type TabId = "profile" | "maintenance" | "documents" | "history" | "rentals";

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

function driverDisplayName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return name || i18n.t("pages.vehicleDetail.viewDriverFallback");
}

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/70",
  rented: "bg-sky-100 text-sky-800 ring-1 ring-sky-200/70",
  maintenance: "bg-amber-100 text-amber-800 ring-1 ring-amber-200/70",
  sold: "bg-slate-100 text-ink ring-1 ring-slate-200/80",
  scrapped: "bg-red-100 text-red-800 ring-1 ring-red-200/70",
};

const cardClass = "rounded-[16px] border border-border/70 bg-white p-4 shadow-soft sm:p-5";
const sectionTitleClass = "mb-3 text-sm font-semibold text-slate-900";
const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const valueClass = "mt-1 text-sm text-slate-900";

function initials(firstName?: string | null, lastName?: string | null): string {
  const f = (firstName ?? "").trim().charAt(0);
  const l = (lastName ?? "").trim().charAt(0);
  return `${f}${l}`.toUpperCase() || "?";
}

export function VehicleDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>("profile");
  const [addMaintenanceOpen, setAddMaintenanceOpen] = useState(false);
  const [assignDriverOpen, setAssignDriverOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverListItem | null>(null);

  const { data: vehicleRes, isLoading: loadingVehicle, isError: vehicleError } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicleById(id!),
    enabled: !!id,
  });

  const { data: maintenanceRes } = useQuery({
    queryKey: ["vehicleMaintenance", id],
    queryFn: () => getVehicleMaintenance(id!),
    enabled: !!id && tab === "maintenance",
  });

  const vehicle = vehicleRes?.data;
  const maintenanceList = maintenanceRes?.data ?? [];
  const canEdit = usePermission("vehicles.edit");
  const canAssign = usePermission("vehicles.assign");
  const canView = usePermission("vehicles.view");

  const assignDriverMutation = useMutation({
    mutationFn: (driverId: string) => assignDriverToVehicle(id!, driverId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vehicle", id] });
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      void queryClient.invalidateQueries({ queryKey: ["vehicle-assignment-history"] });
      void queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setAssignDriverOpen(false);
      setSelectedDriver(null);
    },
  });

  const unassignDriverMutation = useMutation({
    mutationFn: () => unassignDriverFromVehicle(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vehicle", id] });
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      void queryClient.invalidateQueries({ queryKey: ["vehicle-assignment-history"] });
      void queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: (payload: CreateMaintenancePayload) =>
      createVehicleMaintenance(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicleMaintenance", id] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", id] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setAddMaintenanceOpen(false);
    },
  });

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-ink-muted">{t("pages.vehicleDocuments.missingVehicleIdError")}</p>
        <Link to="/vehicles" className="ml-2 text-brand hover:underline">
          {t("pages.vehicleDocuments.backToVehicles")}
        </Link>
      </div>
    );
  }

  if (loadingVehicle || !vehicle) {
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

  const v = vehicle as Vehicle;

  return (
    <div className="min-h-full bg-slate-100">
      <header className="border-b border-border/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link to="/vehicles" className="text-sm text-ink-muted hover:text-ink">
              ← {t("pages.vehicleDocuments.backToVehicles")}
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              {v.year ? `${v.year} ` : ""}
              {v.make} {v.model}
            </h1>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {v.license_plate} · {v.vehicle_type}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-medium capitalize ${
                STATUS_COLORS[v.status] ?? "bg-slate-100 text-ink"
              }`}
            >
              {t(`vehicleStatus.${v.status}`, v.status)}
            </span>
            {canEdit && (
              <Link
                to={`/vehicles/${id}/edit`}
                className="inline-flex h-10 items-center rounded-xl bg-brand-gradient px-4 text-sm font-medium text-white shadow-sm hover:opacity-95 hover:shadow-md"
              >
                {t("pages.vehicleDetail.edit")}
              </Link>
            )}
          </div>
        </div>

        <nav className="mx-auto mt-2 flex max-w-[1600px] gap-2 px-4 pb-3 sm:px-6 lg:px-8">
          {(["profile", "maintenance", "rentals", "history", "documents"] as TabId[]).map((tabId) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setTab(tabId)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium capitalize transition-all duration-200 ${
                tab === tabId
                  ? "bg-white text-brand-dark shadow-soft ring-1 ring-brand/20"
                  : "text-ink-muted hover:bg-white/80 hover:text-ink"
              }`}
            >
              {t(`pages.vehicleDetail.${tabId}`)}
            </button>
          ))}
        </nav>
      </header>

      <main className={`mx-auto p-4 sm:p-6 ${tab === "maintenance" || tab === "history" || tab === "rentals" ? "max-w-6xl" : "max-w-5xl"}`}>
        {tab === "profile" && (
          <div className="space-y-4">
            <section className={cardClass}>
              <h2 className={sectionTitleClass}>{t("pages.vehicleDetail.vehicleDetailsTitle")}</h2>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-sm md:grid-cols-2">
                <div><dt className={labelClass}>{t("pages.vehicleDetail.makeModelLabel")}</dt><dd className={`${valueClass} font-medium`}>{v.make} {v.model}</dd></div>
                <div><dt className={labelClass}>{t("pages.vehicleForm.yearLabel")}</dt><dd className={valueClass}>{v.year ?? "—"}</dd></div>
                <div><dt className={labelClass}>{t("pages.vehicleForm.colorLabel")}</dt><dd className={valueClass}>{v.color ?? "—"}</dd></div>
                <div><dt className={labelClass}>{t("pages.vehicleDetail.licensePlateLabel")}</dt><dd className={`${valueClass} font-mono`}>{v.license_plate}</dd></div>
                <div><dt className={labelClass}>{t("pages.vehicleForm.vinLabel")}</dt><dd className={valueClass}>{v.vin ?? "—"}</dd></div>
                <div><dt className={labelClass}>{t("pages.vehicleDetail.fuelTransmissionLabel")}</dt><dd className={valueClass}>{[v.fuel_type, v.transmission].filter(Boolean).join(" · ") || "—"}</dd></div>
                <div><dt className={labelClass}>{t("pages.vehicleForm.seatingCapacityLabel")}</dt><dd className={valueClass}>{v.seating_capacity ?? "—"}</dd></div>
                <div>
                  <dt className={labelClass}>{t("pages.vehicleForm.currentDriverLabel")}</dt>
                  <dd className={valueClass}>
                    {v.current_driver_id ? (
                      <Link
                        to={`/drivers/${v.current_driver_id}`}
                        className="text-brand hover:underline"
                      >
                        {driverDisplayName(v.driver_first_name, v.driver_last_name)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            {canAssign && (
              <section className={cardClass}>
                <h2 className={sectionTitleClass}>{t("pages.vehicleDetail.driverAssignmentTitle")}</h2>
                {v.current_driver_id ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-slate-50/70 px-3 py-2.5">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-mint text-sm font-semibold text-brand">
                      {initials(v.driver_first_name, v.driver_last_name)}
                    </span>
                    <Link to={`/drivers/${v.current_driver_id}`} className="text-sm font-medium text-brand hover:underline">
                      {driverDisplayName(v.driver_first_name, v.driver_last_name)}
                    </Link>
                    <button
                      type="button"
                      onClick={() => unassignDriverMutation.mutate()}
                      disabled={unassignDriverMutation.isPending}
                      className="ml-auto inline-flex h-9 items-center rounded-full border border-border/80 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {unassignDriverMutation.isPending ? t("pages.vehicleDetail.unassigningButton") : t("pages.vehicleDetail.unassignDriverButton")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAssignDriverOpen(true)}
                    className="inline-flex h-10 items-center rounded-xl bg-brand-gradient px-4 text-sm font-medium text-white hover:opacity-95"
                  >
                    {t("pages.vehicleDetail.assignDriverButton")}
                  </button>
                )}
              </section>
            )}

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>{t("pages.vehicleDetail.rentalRatesRonTitle")}</h2>
              <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-emerald-50/50 px-3 py-3">
                  <dt className={labelClass}>{t("pages.vehicleDetail.dailyLabel")}</dt>
                  <dd className="mt-1.5 text-lg font-semibold text-slate-900">{formatCurrency(Number(v.daily_rent))}</dd>
                </div>
                <div className="rounded-xl border border-border/70 bg-sky-50/50 px-3 py-3">
                  <dt className={labelClass} title={t("pages.vehicleDetail.weeklyPayrollTooltip")}>{t("pages.vehicleDetail.weeklyPayrollLabel")}</dt>
                  <dd className="mt-1.5 text-lg font-semibold text-slate-900">{formatCurrency(Number(v.weekly_rent))}</dd>
                </div>
                <div className="rounded-xl border border-border/70 bg-violet-50/50 px-3 py-3">
                  <dt className={labelClass}>{t("pages.vehicleDetail.monthlyLabel")}</dt>
                  <dd className="mt-1.5 text-lg font-semibold text-slate-900">{formatCurrency(Number(v.monthly_rent))}</dd>
                </div>
              </dl>
            </section>

            {canView && id && (
              <VehicleAssignmentHistoryPanel mode="vehicle" entityId={id} title={t("pages.vehicleDetail.driverHistoryTitle")} />
            )}

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>{t("pages.vehicleDetail.expiryDatesTitle")}</h2>
              <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-slate-50/60 px-3 py-3">
                  <dt className={labelClass}>{t("pages.vehicleForm.insuranceExpiryLabel")}</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">{formatDate(v.insurance_expiry)}</dd>
                </div>
                <div className="rounded-xl border border-border/70 bg-slate-50/60 px-3 py-3">
                  <dt className={labelClass}>{t("pages.vehicleForm.registrationExpiryLabel")}</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">{formatDate(v.registration_expiry)}</dd>
                </div>
              </dl>
            </section>

            {v.notes && (
              <section className={cardClass}>
                <h2 className={sectionTitleClass}>{t("pages.invoiceDetail.notesLabel")}</h2>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{v.notes}</p>
              </section>
            )}
          </div>
        )}

        {tab === "maintenance" && (
          <VehicleMaintenancePanel
            records={maintenanceList}
            canEdit={canEdit}
            onAdd={() => setAddMaintenanceOpen(true)}
          />
        )}

        {tab === "rentals" && id && <VehicleRentalHistoryPanel vehicleId={id} />}

        {tab === "history" && id && <VehicleHistoryTimeline vehicleId={id} />}

        {tab === "documents" && (
          <div className="space-y-4">
            {canEdit && (
              <div className={cardClass}>
                <h2 className={sectionTitleClass}>{t("pages.vehicleDocuments.uploadNewDocumentTitle")}</h2>
                <VehicleDocumentUpload vehicleId={id} />
              </div>
            )}
            <div className={cardClass}>
              <h2 className={sectionTitleClass}>{t("pages.vehicleDocuments.documentsTitle")}</h2>
              <VehicleDocumentList vehicleId={id} />
            </div>
          </div>
        )}
      </main>

      {assignDriverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-ink">{t("pages.vehicleDetail.assignDriverModalTitle")}</h3>
            <p className="text-sm text-ink-muted mt-1">{t("pages.vehicleDetail.assignDriverModalDesc")}</p>
            <div className="mt-4">
              <DriverSearchCombobox
                value={selectedDriver}
                onChange={setSelectedDriver}
                currentVehicleId={id}
                hideLabel
                disabled={assignDriverMutation.isPending}
                inputClassName="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                disabled={!selectedDriver || assignDriverMutation.isPending}
                onClick={() => assignDriverMutation.mutate(selectedDriver!.id)}
                className="rounded-md bg-brand-gradient px-3 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
              >
                {assignDriverMutation.isPending ? t("pages.driverDetail.assigningButton") : t("pages.driverDetail.assignButton")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignDriverOpen(false);
                  setSelectedDriver(null);
                }}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {addMaintenanceOpen && (
        <AddMaintenanceModal
          onClose={() => setAddMaintenanceOpen(false)}
          onSubmit={(payload) => createMaintenanceMutation.mutate(payload)}
          isSubmitting={createMaintenanceMutation.isPending}
        />
      )}
    </div>
  );
}

function AddMaintenanceModal({
  onClose,
  onSubmit,
  isSubmitting,
}: {
  onClose: () => void;
  onSubmit: (p: CreateMaintenancePayload) => void;
  isSubmitting: boolean;
}) {
  const { t } = useTranslation();
  const [maintenanceType, setMaintenanceType] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState<number | "">("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [status, setStatus] = useState<CreateMaintenancePayload["status"]>("pending");
  const [mechanicName, setMechanicName] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceType.trim()) return;
    onSubmit({
      maintenanceType: maintenanceType.trim(),
      description: description.trim() || undefined,
      cost: cost === "" ? undefined : Number(cost),
      scheduledDate: scheduledDate || undefined,
      status,
      mechanicName: mechanicName.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-ink">{t("pages.vehicleDetail.addMaintenanceModalTitle")}</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleDetail.typeRequiredLabel")}</label>
            <input
              type="text"
              required
              placeholder={t("pages.vehicleDetail.typePlaceholder")}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              value={maintenanceType}
              onChange={(e) => setMaintenanceType(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleDetail.descriptionLabel")}</label>
            <textarea
              rows={2}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleDetail.scheduledDateLabel")}</label>
              <input
                type="date"
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleDetail.costRonLabel")}</label>
              <input
                type="number"
                min={0}
                step={0.01}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
                value={cost === "" ? "" : cost}
                onChange={(e) => setCost(e.target.value ? parseFloat(e.target.value) : "")}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t("common.status")}</label>
            <select
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as CreateMaintenancePayload["status"])}
            >
              <option value="pending">{t("pages.vehicleDetail.pendingOption")}</option>
              <option value="in_progress">{t("pages.vehicleDetail.inProgressOption")}</option>
              <option value="completed">{t("pages.vehicleDetail.completedOption")}</option>
              <option value="cancelled">{t("pages.vehicleDetail.cancelledOption")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t("pages.vehicleDetail.mechanicNameLabel")}</label>
            <input
              type="text"
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              value={mechanicName}
              onChange={(e) => setMechanicName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t("pages.invoiceDetail.notesLabel")}</label>
            <textarea
              rows={2}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-brand-gradient px-3 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
            >
              {isSubmitting ? t("pages.vehicleForm.creatingButton") : t("pages.vehicleDetail.createMaintenanceButton")}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
