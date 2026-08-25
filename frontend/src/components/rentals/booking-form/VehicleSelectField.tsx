import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getVehicleById, getVehicles, type VehicleListItem } from "../../../api/vehicles";
import type { RentalQuote } from "../../../api/rentals";
import { useDebounce } from "../../../hooks/useDebounce";
import { formatCurrency } from "../../../utils/currency";

type VehicleSelectFieldProps = {
  vehicles?: VehicleListItem[];
  value: string;
  onChange: (id: string) => void;
  quote: RentalQuote | null;
  quoteLoading?: boolean;
  disabled?: boolean;
  serverSearch?: boolean;
};

export function VehicleSelectField({
  vehicles = [],
  value,
  onChange,
  quote,
  quoteLoading,
  disabled,
  serverSearch = false,
}: VehicleSelectFieldProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query.trim(), 300);

  const listVehicle = vehicles.find((v) => v.id === value) ?? null;

  const fetchedVehicleQuery = useQuery({
    queryKey: ["vehicles", value],
    queryFn: () => getVehicleById(value).then((r) => r.data),
    enabled: serverSearch && !!value && !listVehicle,
  });

  const selected = listVehicle ?? fetchedVehicleQuery.data ?? null;

  const serverSearchQuery = useQuery({
    queryKey: ["vehicles", "search", debouncedQuery],
    queryFn: () => getVehicles({ search: debouncedQuery, limit: 25 }).then((r) => r.data.data),
    enabled: serverSearch && debouncedQuery.length >= 1,
  });

  const filtered = useMemo(() => {
    if (serverSearch) {
      if (!debouncedQuery) return [];
      return serverSearchQuery.data ?? [];
    }
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
  }, [serverSearch, debouncedQuery, serverSearchQuery.data, vehicles, query]);

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
  const searchPlaceholder = serverSearch
    ? t("pages.bookingForm.searchVehicleTypePlaceholder")
    : t("pages.bookingForm.searchVehiclePlaceholder");
  const showSearchLoading = serverSearch && query.trim().length >= 1 && serverSearchQuery.isFetching;

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-sm font-medium text-ink">{t("pages.rentalCalendar.vehicleLabel")}</label>
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
              <p className="mt-1 text-xs text-slate-500">{t("pages.bookingForm.checkingAvailability")}</p>
            ) : availableNow ? (
              <p className="mt-1 text-xs font-medium text-emerald-700">{t("pages.bookingForm.availableNow")}</p>
            ) : unavailable ? (
              <p className="mt-1 text-xs font-medium text-rose-700">
                {quote.conflict?.message ?? t("pages.bookingForm.notAvailableSelectedDates")}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">{t("pages.bookingForm.selectDatesForAvailability")}</p>
            )}
            {dailyHint != null && dailyHint > 0 && (
              <p className="mt-1 text-sm font-semibold text-ink">
                {t("pages.bookingForm.dailyPricePrefix", { amount: formatCurrency(dailyHint) })}
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
          {open &&
            !showSearchLoading &&
            serverSearch &&
            debouncedQuery.length >= 1 &&
            filtered.length === 0 && (
              <p className="mt-1 text-xs text-slate-500">{t("pages.bookingForm.noVehiclesFound")}</p>
            )}
        </>
      )}
    </div>
  );
}
