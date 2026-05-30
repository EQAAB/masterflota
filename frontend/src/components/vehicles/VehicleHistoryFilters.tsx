import type { DriverListItem } from "../../api/drivers";
import type { VehicleHistoryEventType } from "../../api/vehicles";
import { sectionLabel, transitionDefault } from "../../theme/classNames";
import { EVENT_TYPE_OPTIONS } from "./vehicleHistoryDisplayUtils";

const filterCardClass =
  `rounded-[16px] border border-border/70 bg-white/90 p-5 shadow-soft backdrop-blur-sm ${transitionDefault}`;

const filterLabelClass = sectionLabel;

const controlHeight = "h-11 min-h-[44px]";

const filterInputClass =
  `w-full ${controlHeight} rounded-xl border border-border/80 bg-white px-3 pl-9 text-sm text-slate-800 shadow-sm outline-none ` +
  "transition-all duration-200 ease-out placeholder:text-slate-400 " +
  "hover:border-slate-300 hover:bg-slate-50/80 " +
  "focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const filterSelectClass =
  `w-full ${controlHeight} rounded-xl border border-border/80 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none ` +
  "hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20";

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
    </svg>
  );
}

export type VehicleHistoryFiltersProps = {
  eventType: "" | VehicleHistoryEventType;
  onEventTypeChange: (v: "" | VehicleHistoryEventType) => void;
  startDate: string;
  onStartDateChange: (v: string) => void;
  endDate: string;
  onEndDateChange: (v: string) => void;
  driverId: string;
  onDriverIdChange: (v: string) => void;
  drivers: DriverListItem[];
  driversLoading: boolean;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  incidentOpen: boolean;
  onToggleIncident: () => void;
  incidentTitle: string;
  onIncidentTitleChange: (v: string) => void;
  incidentDesc: string;
  onIncidentDescChange: (v: string) => void;
  onSubmitIncident: () => void;
  incidentPending: boolean;
};

export function VehicleHistoryFilters({
  eventType,
  onEventTypeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  driverId,
  onDriverIdChange,
  drivers,
  driversLoading,
  onClearFilters,
  hasActiveFilters,
  incidentOpen,
  onToggleIncident,
  incidentTitle,
  onIncidentTitleChange,
  incidentDesc,
  onIncidentDescChange,
  onSubmitIncident,
  incidentPending,
}: VehicleHistoryFiltersProps) {
  return (
    <div className="space-y-4">
      <div className={filterCardClass}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={filterLabelClass} htmlFor="vh-event-type">
              Event type
            </label>
            <select
              id="vh-event-type"
              className={filterSelectClass}
              value={eventType}
              onChange={(e) => onEventTypeChange(e.target.value as "" | VehicleHistoryEventType)}
            >
              {EVENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={filterLabelClass} htmlFor="vh-start-date">
              From
            </label>
            <div className="relative">
              <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="vh-start-date"
                type="date"
                className={filterInputClass}
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={filterLabelClass} htmlFor="vh-end-date">
              To
            </label>
            <div className="relative">
              <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="vh-end-date"
                type="date"
                className={filterInputClass}
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={filterLabelClass} htmlFor="vh-driver">
              Driver
            </label>
            <select
              id="vh-driver"
              className={filterSelectClass}
              value={driverId}
              onChange={(e) => onDriverIdChange(e.target.value)}
              disabled={driversLoading}
            >
              <option value="">All drivers</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.first_name} {d.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              Clear filters
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onToggleIncident}
            className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 ${
              incidentOpen
                ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                : "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100/80"
            }`}
          >
            <AlertIcon className="h-4 w-4 shrink-0" />
            {incidentOpen ? "Cancel incident" : "Report incident"}
          </button>
        </div>
      </div>

      {incidentOpen && (
        <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
          <p className="text-sm font-medium text-red-900">Log a new incident</p>
          <p className="mt-0.5 text-xs text-red-700/80">
            Record accidents, damage, or other notable events for this vehicle.
          </p>
          <div className="mt-3 space-y-3">
            <input
              type="text"
              placeholder="Incident title (required)"
              className="h-11 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              value={incidentTitle}
              onChange={(e) => onIncidentTitleChange(e.target.value)}
            />
            <textarea
              rows={2}
              placeholder="Description (optional)"
              className="w-full rounded-xl border border-border/80 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              value={incidentDesc}
              onChange={(e) => onIncidentDescChange(e.target.value)}
            />
            <button
              type="button"
              disabled={!incidentTitle.trim() || incidentPending}
              onClick={onSubmitIncident}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:bg-red-700 disabled:opacity-50"
            >
              {incidentPending ? "Saving…" : "Log incident"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
