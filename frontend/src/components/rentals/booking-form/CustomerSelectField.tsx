import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getRentalCustomer, getRentalCustomers, type RentalCustomer } from "../../../api/rentals";
import { useDebounce } from "../../../hooks/useDebounce";
import { initialsFromName } from "../dashboard/rentalDashboardUtils";

type CustomerSelectFieldProps = {
  customers?: RentalCustomer[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  serverSearch?: boolean;
};

export function CustomerSelectField({
  customers = [],
  value,
  onChange,
  disabled,
  serverSearch = false,
}: CustomerSelectFieldProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query.trim(), 300);

  const listCustomer = customers.find((c) => c.id === value) ?? null;

  const fetchedCustomerQuery = useQuery({
    queryKey: ["rentals", "customers", value],
    queryFn: () => getRentalCustomer(value).then((r) => r.data),
    enabled: serverSearch && !!value && !listCustomer,
  });

  const selected = listCustomer ?? fetchedCustomerQuery.data ?? null;

  const serverSearchQuery = useQuery({
    queryKey: ["rentals", "customers", "search", debouncedQuery],
    queryFn: () => getRentalCustomers({ q: debouncedQuery }).then((r) => r.data),
    enabled: serverSearch && debouncedQuery.length >= 1,
  });

  const filtered = useMemo(() => {
    if (serverSearch) {
      if (!debouncedQuery) return [];
      return (serverSearchQuery.data ?? []).slice(0, 25);
    }
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
  }, [serverSearch, debouncedQuery, serverSearchQuery.data, customers, query]);

  const select = (c: RentalCustomer) => {
    onChange(c.id);
    setQuery("");
    setOpen(false);
  };

  const searchPlaceholder = serverSearch
    ? t("pages.bookingForm.searchCustomerTypePlaceholder")
    : t("pages.bookingForm.searchCustomerPlaceholder");
  const showSearchLoading = serverSearch && query.trim().length >= 1 && serverSearchQuery.isFetching;

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-sm font-medium text-ink">{t("pages.rentalCalendar.customerLabel")}</label>
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
              {t("pages.bookingForm.changeButton")}
            </button>
          )}
        </div>
      ) : (
        <>
          <input
            type="search"
            disabled={disabled}
            className="fm-rental-booking-form__input mt-1.5"
            placeholder={searchPlaceholder}
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
          {open && showSearchLoading && (
            <p className="mt-1 text-xs text-slate-500">{t("pages.bookingForm.searchingLabel")}</p>
          )}
          {open && !showSearchLoading && filtered.length > 0 && (
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
          {open &&
            !showSearchLoading &&
            serverSearch &&
            debouncedQuery.length >= 1 &&
            filtered.length === 0 && (
              <p className="mt-1 text-xs text-slate-500">{t("pages.bookingForm.noCustomersFound")}</p>
            )}
        </>
      )}
      <Link
        to="/rentals/customers/new"
        className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
      >
        {t("pages.bookingForm.addNewCustomer")}
      </Link>
    </div>
  );
}
