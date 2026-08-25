import type { ComponentType } from "react";
import i18n from "../../i18n";
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

function IconRentalBooked({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconRentalPickup({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

function IconRentalReturn({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  );
}

function IconRentalCancelled({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconRentalRenewed({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

const EVENT_TYPE_LABEL_KEYS: Record<VehicleHistoryEventType, string> = {
  assigned: "pages.vehicleDetail.eventTypeAssigned",
  unassigned: "pages.vehicleDetail.eventTypeUnassigned",
  status_change: "pages.vehicleDetail.eventTypeStatusChange",
  maintenance: "pages.vehicleDetail.maintenance",
  incident: "pages.vehicleDetail.eventTypeIncident",
  rent_changed: "pages.vehicleDetail.eventTypeRentChanged",
  rent_collected: "pages.vehicleDetail.eventTypeRentCollected",
  rental_booked: "pages.vehicleDetail.eventTypeRentalBooked",
  rental_pickup: "pages.vehicleDetail.eventTypeRentalPickup",
  rental_return: "pages.vehicleDetail.eventTypeRentalReturn",
  rental_cancelled: "pages.vehicleDetail.eventTypeRentalCancelled",
  rental_renewed: "pages.vehicleDetail.eventTypeRentalRenewed",
};

const EVENT_VISUAL_STYLES: Record<VehicleHistoryEventType, Omit<EventVisualConfig, "label">> = {
  assigned: {
    iconBgClass: "bg-brand-mint ring-1 ring-brand/20",
    iconTextClass: "text-brand-dark",
    badgeClass: "bg-brand-mint/70 text-brand-dark ring-1 ring-brand/15",
    Icon: IconAssigned,
  },
  unassigned: {
    iconBgClass: "bg-slate-100 ring-1 ring-slate-200/80",
    iconTextClass: "text-slate-600",
    badgeClass: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
    Icon: IconUnassigned,
  },
  status_change: {
    iconBgClass: "bg-sky-50 ring-1 ring-sky-200/80",
    iconTextClass: "text-sky-700",
    badgeClass: "bg-sky-50 text-sky-800 ring-1 ring-sky-200/70",
    Icon: IconStatus,
  },
  maintenance: {
    iconBgClass: "bg-amber-50 ring-1 ring-amber-200/80",
    iconTextClass: "text-amber-700",
    badgeClass: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/70",
    Icon: IconMaintenance,
  },
  incident: {
    iconBgClass: "bg-red-50 ring-1 ring-red-200/80",
    iconTextClass: "text-red-700",
    badgeClass: "bg-red-50 text-red-800 ring-1 ring-red-200/70",
    Icon: IconIncident,
  },
  rent_changed: {
    iconBgClass: "bg-violet-50 ring-1 ring-violet-200/80",
    iconTextClass: "text-violet-700",
    badgeClass: "bg-violet-50 text-violet-800 ring-1 ring-violet-200/70",
    Icon: IconRentChanged,
  },
  rent_collected: {
    iconBgClass: "bg-emerald-50 ring-1 ring-emerald-200/80",
    iconTextClass: "text-emerald-700",
    badgeClass: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/70",
    Icon: IconRentCollected,
  },
  rental_booked: {
    iconBgClass: "bg-sky-50 ring-1 ring-sky-200/80",
    iconTextClass: "text-sky-700",
    badgeClass: "bg-sky-50 text-sky-800 ring-1 ring-sky-200/70",
    Icon: IconRentalBooked,
  },
  rental_pickup: {
    iconBgClass: "bg-brand-mint ring-1 ring-brand/20",
    iconTextClass: "text-brand-dark",
    badgeClass: "bg-brand-mint/70 text-brand-dark ring-1 ring-brand/15",
    Icon: IconRentalPickup,
  },
  rental_return: {
    iconBgClass: "bg-slate-100 ring-1 ring-slate-200/80",
    iconTextClass: "text-slate-600",
    badgeClass: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
    Icon: IconRentalReturn,
  },
  rental_cancelled: {
    iconBgClass: "bg-red-50 ring-1 ring-red-200/80",
    iconTextClass: "text-red-700",
    badgeClass: "bg-red-50 text-red-800 ring-1 ring-red-200/70",
    Icon: IconRentalCancelled,
  },
  rental_renewed: {
    iconBgClass: "bg-violet-50 ring-1 ring-violet-200/80",
    iconTextClass: "text-violet-700",
    badgeClass: "bg-violet-50 text-violet-800 ring-1 ring-violet-200/70",
    Icon: IconRentalRenewed,
  },
};

export function getEventTypeOptions(): { value: "" | VehicleHistoryEventType; label: string }[] {
  return [
    { value: "", label: i18n.t("pages.vehicleDetail.eventTypeAllOption") },
    ...(Object.keys(EVENT_TYPE_LABEL_KEYS) as VehicleHistoryEventType[]).map((value) => ({
      value,
      label: i18n.t(EVENT_TYPE_LABEL_KEYS[value]),
    })),
  ];
}

export function getEventVisual(type: VehicleHistoryEventType | string): EventVisualConfig {
  const styles = EVENT_VISUAL_STYLES[type as VehicleHistoryEventType];
  if (styles) {
    return { ...styles, label: i18n.t(EVENT_TYPE_LABEL_KEYS[type as VehicleHistoryEventType]) };
  }
  return {
    iconBgClass: "bg-slate-100 ring-1 ring-slate-200/80",
    iconTextClass: "text-slate-600",
    badgeClass: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
    Icon: IconStatus,
    label: type.replace(/_/g, " "),
  };
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
