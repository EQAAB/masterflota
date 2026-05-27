import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
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
import { getDrivers, type DriverListItem } from "../../api/drivers";
import { VehicleDocumentUpload } from "../../components/vehicles/VehicleDocumentUpload";
import { VehicleDocumentList } from "../../components/vehicles/VehicleDocumentList";
import { VehicleAssignmentHistoryPanel } from "../../components/vehicles/VehicleAssignmentHistoryPanel";
import { VehicleMaintenancePanel } from "../../components/vehicles/VehicleMaintenancePanel";
import { useAuthStore } from "../../store/authStore";
import { formatCurrency } from "../../utils/currency";

type TabId = "profile" | "maintenance" | "documents";

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
  return name || "View driver";
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
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<TabId>("profile");
  const [addMaintenanceOpen, setAddMaintenanceOpen] = useState(false);
  const [assignDriverOpen, setAssignDriverOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");

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

  const { data: driversRes } = useQuery({
    queryKey: ["drivers", "for-assign"],
    queryFn: () => getDrivers({ limit: 500, status: "active" }),
    enabled: assignDriverOpen && !!id,
  });

  const vehicle = vehicleRes?.data;
  const maintenanceList = maintenanceRes?.data ?? [];
  const driversForAssign = driversRes?.data ?? [];
  const canEdit = user?.role === "admin" || user?.role === "accountant";

  const assignDriverMutation = useMutation({
    mutationFn: (driverId: string) => assignDriverToVehicle(id!, driverId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vehicle", id] });
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      void queryClient.invalidateQueries({ queryKey: ["vehicle-assignment-history"] });
      void queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setAssignDriverOpen(false);
      setSelectedDriverId("");
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
        <p className="text-ink-muted">Missing vehicle ID.</p>
        <Link to="/vehicles" className="ml-2 text-brand hover:underline">
          Back to vehicles
        </Link>
      </div>
    );
  }

  if (loadingVehicle || !vehicle) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-block w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink-muted">Loading vehicle...</p>
        </div>
      </div>
    );
  }

  if (vehicleError) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center max-w-md">
          <p className="text-red-600">Failed to load vehicle.</p>
          <Link to="/vehicles" className="mt-3 inline-block text-sm text-brand hover:underline">
            Back to vehicles
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
              ← Back to vehicles
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
              {v.status}
            </span>
            {canEdit && (
              <Link
                to={`/vehicles/${id}/edit`}
                className="inline-flex h-10 items-center rounded-xl bg-brand-gradient px-4 text-sm font-medium text-white shadow-sm hover:opacity-95 hover:shadow-md"
              >
                Edit vehicle
              </Link>
            )}
          </div>
        </div>

        <nav className="mx-auto mt-2 flex max-w-[1600px] gap-2 px-4 pb-3 sm:px-6 lg:px-8">
          {(["profile", "maintenance", "documents"] as TabId[]).map((t) => (
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

      <main className={`mx-auto p-4 sm:p-6 ${tab === "maintenance" ? "max-w-6xl" : "max-w-5xl"}`}>
        {tab === "profile" && (
          <div className="space-y-4">
            <section className={cardClass}>
              <h2 className={sectionTitleClass}>Vehicle details</h2>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-sm md:grid-cols-2">
                <div><dt className={labelClass}>Make / Model</dt><dd className={`${valueClass} font-medium`}>{v.make} {v.model}</dd></div>
                <div><dt className={labelClass}>Year</dt><dd className={valueClass}>{v.year ?? "—"}</dd></div>
                <div><dt className={labelClass}>Color</dt><dd className={valueClass}>{v.color ?? "—"}</dd></div>
                <div><dt className={labelClass}>License plate</dt><dd className={`${valueClass} font-mono`}>{v.license_plate}</dd></div>
                <div><dt className={labelClass}>VIN</dt><dd className={valueClass}>{v.vin ?? "—"}</dd></div>
                <div><dt className={labelClass}>Fuel / Transmission</dt><dd className={valueClass}>{[v.fuel_type, v.transmission].filter(Boolean).join(" · ") || "—"}</dd></div>
                <div><dt className={labelClass}>Seating capacity</dt><dd className={valueClass}>{v.seating_capacity ?? "—"}</dd></div>
                <div>
                  <dt className={labelClass}>Current driver</dt>
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

            {canEdit && (
              <section className={cardClass}>
                <h2 className={sectionTitleClass}>Driver assignment</h2>
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
                      {unassignDriverMutation.isPending ? "Unassigning…" : "Unassign driver"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAssignDriverOpen(true)}
                    className="inline-flex h-10 items-center rounded-xl bg-brand-gradient px-4 text-sm font-medium text-white hover:opacity-95"
                  >
                    Assign driver
                  </button>
                )}
              </section>
            )}

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>Rental rates (RON)</h2>
              <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-emerald-50/50 px-3 py-3">
                  <dt className={labelClass}>Daily</dt>
                  <dd className="mt-1.5 text-lg font-semibold text-slate-900">{formatCurrency(Number(v.daily_rent))}</dd>
                </div>
                <div className="rounded-xl border border-border/70 bg-sky-50/50 px-3 py-3">
                  <dt className={labelClass} title="Deducted each payout week while assigned to a driver.">Weekly (payroll)</dt>
                  <dd className="mt-1.5 text-lg font-semibold text-slate-900">{formatCurrency(Number(v.weekly_rent))}</dd>
                </div>
                <div className="rounded-xl border border-border/70 bg-violet-50/50 px-3 py-3">
                  <dt className={labelClass}>Monthly</dt>
                  <dd className="mt-1.5 text-lg font-semibold text-slate-900">{formatCurrency(Number(v.monthly_rent))}</dd>
                </div>
              </dl>
            </section>

            {(user?.role === "admin" || user?.role === "accountant") && id && (
              <VehicleAssignmentHistoryPanel mode="vehicle" entityId={id} title="Driver history" />
            )}

            <section className={cardClass}>
              <h2 className={sectionTitleClass}>Expiry dates</h2>
              <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-slate-50/60 px-3 py-3">
                  <dt className={labelClass}>Insurance expiry</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">{formatDate(v.insurance_expiry)}</dd>
                </div>
                <div className="rounded-xl border border-border/70 bg-slate-50/60 px-3 py-3">
                  <dt className={labelClass}>Registration expiry</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">{formatDate(v.registration_expiry)}</dd>
                </div>
              </dl>
            </section>

            {v.notes && (
              <section className={cardClass}>
                <h2 className={sectionTitleClass}>Notes</h2>
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

        {tab === "documents" && (
          <div className="space-y-4">
            {canEdit && (
              <div className={cardClass}>
                <h2 className={sectionTitleClass}>Upload new document</h2>
                <VehicleDocumentUpload vehicleId={id} />
              </div>
            )}
            <div className={cardClass}>
              <h2 className={sectionTitleClass}>Documents</h2>
              <VehicleDocumentList vehicleId={id} />
            </div>
          </div>
        )}
      </main>

      {assignDriverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-ink">Assign driver</h3>
            <p className="text-sm text-ink-muted mt-1">Select a driver for this vehicle.</p>
            <select
              className="mt-4 w-full rounded-md border border-border px-3 py-2 text-sm"
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
            >
              <option value="">Choose driver…</option>
              {driversForAssign.map((d: DriverListItem) => (
                <option key={d.id} value={d.id}>
                  {d.first_name} {d.last_name}
                  {d.current_vehicle_id && d.current_vehicle_id !== id ? " (reassign)" : ""}
                </option>
              ))}
            </select>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                disabled={!selectedDriverId || assignDriverMutation.isPending}
                onClick={() => assignDriverMutation.mutate(selectedDriverId)}
                className="rounded-md bg-brand-gradient px-3 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
              >
                {assignDriverMutation.isPending ? "Assigning…" : "Assign"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignDriverOpen(false);
                  setSelectedDriverId("");
                }}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50"
              >
                Cancel
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
        <h3 className="text-lg font-semibold text-ink">Add maintenance</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Type *</label>
            <input
              type="text"
              required
              placeholder="e.g. Oil change, Tire rotation"
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              value={maintenanceType}
              onChange={(e) => setMaintenanceType(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Description</label>
            <textarea
              rows={2}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Scheduled date</label>
              <input
                type="date"
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Cost (RON)</label>
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
            <label className="block text-sm font-medium text-ink mb-1">Status</label>
            <select
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as CreateMaintenancePayload["status"])}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Mechanic name</label>
            <input
              type="text"
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              value={mechanicName}
              onChange={(e) => setMechanicName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Notes</label>
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
              {isSubmitting ? "Creating..." : "Create maintenance"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
