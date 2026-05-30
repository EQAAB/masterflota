import type { ComponentType } from "react";
import type { VehicleHistoryEventType } from "../../api/vehicles";

export type EventVisualConfig = {
  label: string;
  iconBgClass: string;
  iconTextClass: string;
  badgeClass: string;
  Icon: ComponentType<{ className?: string }>;
};

function IconAssigned({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4M7 20h10a2 2 0 002-2V9.5L12 4 5 9.5V18a2 2 0 002 2z" />
    </svg>
  );
}

function IconUnassigned({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function IconStatus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function IconMaintenance({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconIncident({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}

function IconRentChanged({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function IconRentCollected({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

export const EVENT_TYPE_OPTIONS: { value: "" | VehicleHistoryEventType; label: string }[] = [
  { value: "", label: "All events" },
  { value: "assigned", label: "Assigned" },
  { value: "unassigned", label: "Unassigned" },
  { value: "status_change", label: "Status change" },
  { value: "maintenance", label: "Maintenance" },
  { value: "incident", label: "Incident" },
  { value: "rent_changed", label: "Rent changed" },
  { value: "rent_collected", label: "Rent collected" },
];

export const EVENT_VISUALS: Record<VehicleHistoryEventType, EventVisualConfig> = {
  assigned: {
    label: "Assigned",
    iconBgClass: "bg-brand-mint ring-1 ring-brand/20",
    iconTextClass: "text-brand-dark",
    badgeClass: "bg-brand-mint/70 text-brand-dark ring-1 ring-brand/15",
    Icon: IconAssigned,
  },
  unassigned: {
    label: "Unassigned",
    iconBgClass: "bg-slate-100 ring-1 ring-slate-200/80",
    iconTextClass: "text-slate-600",
    badgeClass: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
    Icon: IconUnassigned,
  },
  status_change: {
    label: "Status change",
    iconBgClass: "bg-sky-50 ring-1 ring-sky-200/80",
    iconTextClass: "text-sky-700",
    badgeClass: "bg-sky-50 text-sky-800 ring-1 ring-sky-200/70",
    Icon: IconStatus,
  },
  maintenance: {
    label: "Maintenance",
    iconBgClass: "bg-amber-50 ring-1 ring-amber-200/80",
    iconTextClass: "text-amber-700",
    badgeClass: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/70",
    Icon: IconMaintenance,
  },
  incident: {
    label: "Incident",
    iconBgClass: "bg-red-50 ring-1 ring-red-200/80",
    iconTextClass: "text-red-700",
    badgeClass: "bg-red-50 text-red-800 ring-1 ring-red-200/70",
    Icon: IconIncident,
  },
  rent_changed: {
    label: "Rent changed",
    iconBgClass: "bg-violet-50 ring-1 ring-violet-200/80",
    iconTextClass: "text-violet-700",
    badgeClass: "bg-violet-50 text-violet-800 ring-1 ring-violet-200/70",
    Icon: IconRentChanged,
  },
  rent_collected: {
    label: "Rent collected",
    iconBgClass: "bg-emerald-50 ring-1 ring-emerald-200/80",
    iconTextClass: "text-emerald-700",
    badgeClass: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/70",
    Icon: IconRentCollected,
  },
};

export function getEventVisual(type: VehicleHistoryEventType): EventVisualConfig {
  return EVENT_VISUALS[type];
}

export function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function driverDisplayName(first: string | null, last: string | null): string {
  const n = `${first ?? ""} ${last ?? ""}`.trim();
  return n || "—";
}
