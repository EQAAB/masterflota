import { useMemo, useRef, useState } from "react";
import type { VehicleListItem } from "../../../api/vehicles";
import type { RentalQuote } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";

type VehicleSelectFieldProps = {
  vehicles: VehicleListItem[];
  value: string;
  onChange: (id: string) => void;
  quote: RentalQuote | null;
  quoteLoading?: boolean;
  disabled?: boolean;
};

export function VehicleSelectField({
  vehicles,
  value,
  onChange,
  quote,
  quoteLoading,
  disabled,
}: VehicleSelectFieldProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = vehicles.find((v) => v.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles.slice(0, 12);
    return vehicles
      .filter(
        (v) =>
          v.license_plate.toLowerCase().includes(q) ||
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [vehicles, query]);

  const select = (v: VehicleListItem) => {
    onChange(v.id);
    setQuery("");
    setOpen(false);
  };

  const dailyHint = selected
    ? Number(selected.daily_rent) || quote?.rates.daily
    : null;

  const unavailable = quote && !quote.available;
  const availableNow = quote?.available && !quoteLoading;

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-sm font-medium text-ink">Vehicle</label>
      {selected ? (
        <div
          className={`fm-rental-booking-form__preview-card ${
            unavailable ? "border-rose-200 bg-rose-50/40" : ""
          }`}
        >
          <div className="fm-rental-booking-form__thumb">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 17h8M6 11l1-4h10l1 4M5 17h14v2H5v-2z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-bold text-ink">{selected.license_plate}</p>
            <p className="text-sm text-ink-muted">
              {selected.make} {selected.model}
            </p>
            {quoteLoading ? (
              <p className="mt-1 text-xs text-slate-500">Checking availability…</p>
            ) : availableNow ? (
              <p className="mt-1 text-xs font-medium text-emerald-700">Available now</p>
            ) : unavailable ? (
              <p className="mt-1 text-xs font-medium text-rose-700">
                {quote.conflict?.message ?? "Not available for selected dates"}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Select dates for availability</p>
            )}
            {dailyHint != null && dailyHint > 0 && (
              <p className="mt-1 text-sm font-semibold text-ink">
                Daily: {formatCurrency(dailyHint)}
              </p>
            )}
          </div>
          {!disabled && (
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-brand hover:underline"
              onClick={() => {
                onChange("");
                setQuery("");
              }}
            >
              Change
            </button>
          )}
        </div>
      ) : (
        <>
          <input
            type="search"
            disabled={disabled}
            className="fm-rental-booking-form__input mt-1.5"
            placeholder="Search plate, make, or model…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlight(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => Math.min(h + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
              } else if (e.key === "Enter" && filtered[highlight]) {
                e.preventDefault();
                select(filtered[highlight]);
              }
            }}
          />
          {open && filtered.length > 0 && (
            <ul className="fm-rental-booking-form__combobox-list" role="listbox">
              {filtered.map((v, i) => (
                <li
                  key={v.id}
                  role="option"
                  className={`fm-rental-booking-form__combobox-option ${
                    i === highlight ? "fm-rental-booking-form__combobox-option--active" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(v);
                  }}
                >
                  <span className="font-mono font-semibold">{v.license_plate}</span>
                  <span className="ml-2 text-ink-muted">
                    {v.make} {v.model}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
