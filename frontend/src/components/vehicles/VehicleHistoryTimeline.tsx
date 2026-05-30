import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createVehicleIncident,
  getVehicleHistory,
  type VehicleHistoryEventType,
} from "../../api/vehicles";
import { getDrivers } from "../../api/drivers";
import { useAuthStore } from "../../store/authStore";
import { alertError, transitionDefault } from "../../theme/classNames";
import { VehicleHistoryFilters } from "./VehicleHistoryFilters";
import { VehicleHistoryTimelineItem } from "./VehicleHistoryTimelineItem";
import { formatEventDate } from "./vehicleHistoryDisplayUtils";

function TimelineSkeleton() {
  return (
    <div className="relative pl-0">
      <div className="absolute bottom-3 left-[15px] top-3 w-0.5 bg-gradient-to-b from-border via-brand/20 to-border sm:left-[19px]" aria-hidden />
      <div className="space-y-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex animate-pulse gap-4 sm:gap-5">
            <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200 sm:h-10 sm:w-10" />
            <div className="flex-1 space-y-3 rounded-2xl border border-border/40 bg-white p-5">
              <div className="flex justify-between gap-4">
                <div className="h-5 w-40 rounded bg-slate-200" />
                <div className="h-4 w-24 rounded bg-slate-100" />
              </div>
              <div className="h-4 w-full max-w-md rounded bg-slate-100" />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="h-10 rounded bg-slate-100" />
                <div className="h-10 rounded bg-slate-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/80 bg-white px-6 py-12 text-center shadow-soft">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-mint/60 ring-1 ring-brand/15">
        <svg className="h-7 w-7 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink">No events yet</h3>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-muted">
        No events match this filter. Assignments, status changes, maintenance, incidents, and rent actions will appear here automatically.
      </p>
    </div>
  );
}

export function VehicleHistoryTimeline({ vehicleId }: { vehicleId: string }) {
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === "admin" || user?.role === "accountant";
  const qc = useQueryClient();

  const [eventType, setEventType] = useState<"" | VehicleHistoryEventType>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [driverId, setDriverId] = useState("");
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentDesc, setIncidentDesc] = useState("");

  const filters = useMemo(
    () => ({
      eventType: eventType || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      driverId: driverId || undefined,
    }),
    [eventType, startDate, endDate, driverId],
  );

  const hasActiveFilters = !!(eventType || startDate || endDate || driverId);

  const historyQuery = useQuery({
    queryKey: ["vehicle-history", vehicleId, filters],
    queryFn: () => getVehicleHistory(vehicleId, filters).then((r) => r.data.rows),
    enabled: !!vehicleId && canEdit,
  });

  const driversQuery = useQuery({
    queryKey: ["drivers", "list-short"],
    queryFn: () => getDrivers({ limit: 500 }).then((r) => r.data),
    enabled: canEdit,
  });

  const incidentMut = useMutation({
    mutationFn: () =>
      createVehicleIncident(vehicleId, {
        title: incidentTitle.trim(),
        description: incidentDesc.trim() || undefined,
      }),
    onSuccess: () => {
      setIncidentTitle("");
      setIncidentDesc("");
      setIncidentOpen(false);
      void qc.invalidateQueries({ queryKey: ["vehicle-history", vehicleId] });
    },
  });

  if (!canEdit) {
    return <p className="text-sm text-ink-muted">You do not have access to vehicle history.</p>;
  }

  const rows = historyQuery.data ?? [];
  const eventCount = rows.length;
  const lastUpdated =
    historyQuery.dataUpdatedAt > 0 ? formatEventDate(new Date(historyQuery.dataUpdatedAt).toISOString()) : null;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold tracking-tight text-ink">Audit trail</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Assignments, status and rent changes, maintenance, incidents, and payroll rent deductions.
        </p>
        {!historyQuery.isLoading && !historyQuery.isError && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-brand-mint/50 px-3 py-1 text-xs font-medium text-brand-dark ring-1 ring-brand/10">
              {eventCount} {eventCount === 1 ? "event" : "events"}
            </span>
            {lastUpdated && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-ink-muted">
                Last updated {lastUpdated}
              </span>
            )}
          </div>
        )}
      </header>

      <VehicleHistoryFilters
        eventType={eventType}
        onEventTypeChange={setEventType}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        driverId={driverId}
        onDriverIdChange={setDriverId}
        drivers={driversQuery.data ?? []}
        driversLoading={driversQuery.isLoading}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() => {
          setEventType("");
          setStartDate("");
          setEndDate("");
          setDriverId("");
        }}
        incidentOpen={incidentOpen}
        onToggleIncident={() => setIncidentOpen((v) => !v)}
        incidentTitle={incidentTitle}
        onIncidentTitleChange={setIncidentTitle}
        incidentDesc={incidentDesc}
        onIncidentDescChange={setIncidentDesc}
        onSubmitIncident={() => incidentMut.mutate()}
        incidentPending={incidentMut.isPending}
      />

      {historyQuery.isLoading && <TimelineSkeleton />}

      {historyQuery.isError && (
        <div className={alertError} role="alert">
          Failed to load vehicle history. Please try again.
        </div>
      )}

      {!historyQuery.isLoading && !historyQuery.isError && rows.length === 0 && <EmptyState />}

      {!historyQuery.isLoading && rows.length > 0 && (
        <div className={`relative ${transitionDefault}`}>
          <div
            className="absolute bottom-3 left-[15px] top-3 w-0.5 bg-gradient-to-b from-border via-brand/20 to-border sm:left-[19px]"
            aria-hidden
          />
          <ol className="relative space-y-0 pl-0">
            {rows.map((event, index) => (
              <VehicleHistoryTimelineItem
                key={event.id}
                event={event}
                isLast={index === rows.length - 1}
              />
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
