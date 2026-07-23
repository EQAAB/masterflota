import { useEffect, useId, useRef } from "react";
import type { VehicleListItem } from "../../api/vehicles";
import { useVehicleCombobox } from "../../hooks/useVehicleCombobox";

function formatVehicleLabel(v: VehicleListItem): string {
  const details = [v.year, v.make, v.model].filter(Boolean).join(" ");
  return details ? `${v.license_plate} — ${details}` : v.license_plate;
}

function vehicleSubtitle(v: VehicleListItem): string {
  const parts = [v.year, v.make, v.model].filter(Boolean);
  return parts.join(" ");
}

type VehicleSearchComboboxProps = {
  value: VehicleListItem | null;
  onChange: (vehicle: VehicleListItem | null) => void;
  disabled?: boolean;
  /** When set, shows a reassign hint if the vehicle has a different driver assigned. */
  currentDriverId?: string;
  hideLabel?: boolean;
  inputClassName?: string;
};

export function VehicleSearchCombobox({
  value,
  onChange,
  disabled,
  currentDriverId,
  hideLabel = false,
  inputClassName,
}: VehicleSearchComboboxProps) {
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listboxId = `${baseId}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    rootRef,
    open,
    setOpen,
    inputValue,
    setInputValue,
    highlightedIndex,
    setHighlightedIndex,
    results,
    isFetching,
    isError,
    refetch,
    moveHighlight,
    getHighlightedOrFirstVehicle,
  } = useVehicleCombobox();

  useEffect(() => {
    if (value) {
      setInputValue(formatVehicleLabel(value));
    }
  }, [value?.id, value?.license_plate, value?.year, value?.make, value?.model, setInputValue]);

  const handleInputChange = (next: string) => {
    setInputValue(next);
    if (value) onChange(null);
  };

  const selectVehicle = (v: VehicleListItem) => {
    onChange(v);
    setInputValue(formatVehicleLabel(v));
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else moveHighlight(1);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open) moveHighlight(-1);
      return;
    }

    if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      const pick = getHighlightedOrFirstVehicle();
      if (pick) selectVehicle(pick);
      else setOpen(false);
    }
  };

  const activeDescendantId =
    open && highlightedIndex >= 0 && results[highlightedIndex]
      ? `${listboxId}-opt-${highlightedIndex}`
      : undefined;

  const defaultInputClass =
    "w-full rounded-xl border border-border/80 bg-white px-3 py-2.5 text-sm text-ink shadow-sm outline-none placeholder:text-slate-400 focus:border-brand/30 focus:ring-2 focus:ring-brand/15";

  return (
    <div ref={rootRef} className="relative">
      {!hideLabel && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-ink">
          Vehicle *
        </label>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        autoComplete="off"
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-required={!hideLabel}
        aria-activedescendant={activeDescendantId}
        placeholder="Search by plate, make, model, or VIN…"
        className={inputClassName ?? defaultInputClass}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[55] cursor-default bg-slate-900/35 backdrop-blur-[1px] md:hidden"
            aria-label="Close vehicle list"
            onClick={() => setOpen(false)}
          />
          <ul
            id={listboxId}
            role="listbox"
            className="fixed inset-x-0 bottom-0 z-[60] max-h-[min(78vh,640px)] overflow-auto rounded-t-2xl border border-white/50 bg-white/90 py-1 shadow-2xl backdrop-blur-lg ring-1 ring-slate-900/5 md:absolute md:inset-x-auto md:bottom-auto md:left-0 md:right-0 md:top-full md:z-20 md:mt-1 md:max-h-60 md:rounded-xl md:border-border/80 md:bg-white md:shadow-lg"
          >
            <li
              role="presentation"
              className="sticky top-0 z-10 border-b border-border/80 bg-white/95 px-3 py-2 text-center text-xs font-medium text-ink-muted backdrop-blur-sm md:hidden"
            >
              Select a vehicle
            </li>
            {isFetching && (
              <li role="presentation" className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-ink-muted">
                <span
                  className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-border border-t-sky-600"
                  aria-hidden
                />
                Loading vehicles…
              </li>
            )}
            {!isFetching && isError && (
              <li role="presentation" className="px-3 py-3 text-center text-sm text-red-600">
                Could not load vehicles.{" "}
                <button type="button" className="font-medium text-brand underline" onClick={() => refetch()}>
                  Retry
                </button>
              </li>
            )}
            {!isFetching && !isError && results.length === 0 && (
              <li role="presentation" className="px-3 py-4 text-center text-sm text-ink-muted">
                No vehicles match your search.
              </li>
            )}
            {!isFetching &&
              !isError &&
              results.map((v, i) => {
                const active = i === highlightedIndex;
                const isReassign =
                  !!v.current_driver_id &&
                  (!currentDriverId || v.current_driver_id !== currentDriverId);
                const driverName = [v.driver_first_name, v.driver_last_name].filter(Boolean).join(" ");
                return (
                  <li
                    key={v.id}
                    id={`${listboxId}-opt-${i}`}
                    role="option"
                    aria-selected={value?.id === v.id}
                    className={`cursor-pointer px-3 py-2.5 text-sm ${
                      active ? "bg-brand-mint/90 text-ink" : "text-ink hover:bg-slate-50"
                    }`}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectVehicle(v);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{v.license_plate}</span>
                      {isReassign && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                          reassign
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-muted">{vehicleSubtitle(v)}</div>
                    {isReassign && driverName && (
                      <div className="text-xs text-ink-muted">Currently: {driverName}</div>
                    )}
                  </li>
                );
              })}
          </ul>
        </>
      )}
    </div>
  );
}
