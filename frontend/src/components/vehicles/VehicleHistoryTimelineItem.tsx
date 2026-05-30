import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { VehicleHistoryEvent } from "../../api/vehicles";
import { linkAccent, transitionDefault } from "../../theme/classNames";
import { formatCurrency } from "../../utils/currency";
import {
  driverDisplayName,
  formatEventDate,
  getEventVisual,
} from "./vehicleHistoryDisplayUtils";

const STATUS_BADGE: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/70",
  rented: "bg-sky-50 text-sky-800 ring-1 ring-sky-200/70",
  maintenance: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/70",
  sold: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
  scrapped: "bg-red-50 text-red-800 ring-1 ring-red-200/70",
};

function StatusPill({ status }: { status: string }) {
  const cls = STATUS_BADGE[status] ?? "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function MetadataRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

function amountLabel(eventType: VehicleHistoryEvent["event_type"]): string {
  if (eventType === "rent_collected") return "Amount collected";
  if (eventType === "maintenance" || eventType === "incident") return "Amount deducted";
  return "Amount";
}

export function VehicleHistoryTimelineItem({
  event,
  isLast,
}: {
  event: VehicleHistoryEvent;
  isLast: boolean;
}) {
  const visual = getEventVisual(event.event_type);
  const { Icon } = visual;

  const driverId = event.driver_id ?? event.previous_driver_id;
  const driverName = driverId
    ? driverDisplayName(
        event.driver_id ? event.driver_first_name : event.previous_driver_first_name,
        event.driver_id ? event.driver_last_name : event.previous_driver_last_name,
      )
    : null;

  const hasCost = event.cost != null && Number(event.cost) !== 0;
  const loggedBy = event.created_by_first_name
    ? driverDisplayName(event.created_by_first_name, event.created_by_last_name)
    : null;

  const metadataRows: ReactNode[] = [];

  if (driverName && driverName !== "—" && driverId) {
    metadataRows.push(
      <MetadataRow key="driver" label="Driver">
        <Link to={`/drivers/${driverId}`} className={linkAccent}>
          {driverName}
        </Link>
      </MetadataRow>,
    );
  }

  if (loggedBy) {
    metadataRows.push(
      <MetadataRow key="logged-by" label="Logged by">
        {loggedBy}
      </MetadataRow>,
    );
  }

  if (event.previous_status && event.new_status) {
    metadataRows.push(
      <MetadataRow key="status" label="Status">
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <StatusPill status={event.previous_status} />
          <span className="text-ink-muted" aria-hidden>
            →
          </span>
          <StatusPill status={event.new_status} />
        </span>
      </MetadataRow>,
    );
  }

  if (event.previous_rent != null && event.new_rent != null) {
    metadataRows.push(
      <MetadataRow key="rent" label="Weekly rent">
        {formatCurrency(Number(event.previous_rent))} → {formatCurrency(Number(event.new_rent))}
      </MetadataRow>,
    );
  }

  if (hasCost && event.event_type !== "rent_collected" && event.event_type !== "maintenance" && event.event_type !== "incident") {
    metadataRows.push(
      <MetadataRow key="amount" label="Amount">
        {formatCurrency(Number(event.cost))}
      </MetadataRow>,
    );
  }

  if (event.odometer_reading != null) {
    metadataRows.push(
      <MetadataRow key="odometer" label="Odometer">
        {event.odometer_reading.toLocaleString()} km
      </MetadataRow>,
    );
  }

  return (
    <li className={`relative flex gap-4 pb-8 sm:gap-5 ${isLast ? "pb-0" : ""}`}>
      <div className="flex w-8 shrink-0 flex-col items-center sm:w-10">
        <div
          className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10 ${visual.iconBgClass}`}
        >
          <Icon className={`h-4 w-4 sm:h-[18px] sm:w-[18px] ${visual.iconTextClass}`} />
        </div>
      </div>

      <article
        className={`min-w-0 flex-1 rounded-2xl border border-border/60 bg-white p-4 shadow-soft sm:p-5 hover:-translate-y-0.5 hover:border-brand/15 hover:shadow-card-hover ${transitionDefault}`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-ink">
                {event.title ?? visual.label}
              </h3>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${visual.badgeClass}`}
              >
                {visual.label}
              </span>
            </div>
          </div>
          <time className="shrink-0 text-xs tabular-nums text-ink-muted sm:text-right">
            {formatEventDate(event.event_date)}
          </time>
        </div>

        {hasCost && (
          <div className="mt-3 rounded-xl bg-brand-mint/30 px-3 py-2.5 ring-1 ring-brand/10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              {amountLabel(event.event_type)}
            </p>
            <p className="text-lg font-semibold tabular-nums text-brand-dark">
              {formatCurrency(Number(event.cost))}
            </p>
          </div>
        )}

        {event.description && (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{event.description}</p>
        )}

        {metadataRows.length > 0 && (
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-border/50 pt-4 sm:grid-cols-2">
            {metadataRows}
          </dl>
        )}
      </article>
    </li>
  );
}
