import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { RentalCustomer } from "../../../api/rentals";
import { initialsFromName } from "../dashboard/rentalDashboardUtils";

type CustomerSelectFieldProps = {
  customers: RentalCustomer[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
};

export function CustomerSelectField({
  customers,
  value,
  onChange,
  disabled,
}: CustomerSelectFieldProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = customers.find((c) => c.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, 12);
    return customers
      .filter(
        (c) =>
          c.legal_name.toLowerCase().includes(q) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.phone?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 12);
  }, [customers, query]);

  const select = (c: RentalCustomer) => {
    onChange(c.id);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-sm font-medium text-ink">Customer</label>
      {selected ? (
        <div className="fm-rental-booking-form__preview-card">
          <div className="fm-rental-booking-form__avatar">{initialsFromName(selected.legal_name)}</div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">{selected.legal_name}</p>
            {selected.email && <p className="text-sm text-ink-muted">{selected.email}</p>}
            {selected.phone && <p className="text-sm text-ink-muted">{selected.phone}</p>}
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
            placeholder="Search by name, email, or phone…"
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
              {filtered.map((c, i) => (
                <li
                  key={c.id}
                  role="option"
                  aria-selected={i === highlight}
                  className={`fm-rental-booking-form__combobox-option ${
                    i === highlight ? "fm-rental-booking-form__combobox-option--active" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(c);
                  }}
                >
                  <span className="font-medium">{c.legal_name}</span>
                  {(c.email || c.phone) && (
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      {[c.email, c.phone].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <Link
        to="/rentals/customers/new"
        className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
      >
        + Add new customer
      </Link>
    </div>
  );
}
