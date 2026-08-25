import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { DriverListItem } from "../../api/drivers";
import { useDriverCombobox } from "../../hooks/useDriverCombobox";

function formatDriverLabel(d: DriverListItem): string {
  return `${d.first_name} ${d.last_name} (${d.phone})`;
}

type DriverSearchComboboxProps = {
  value: DriverListItem | null;
  onChange: (driver: DriverListItem | null) => void;
  disabled?: boolean;
  /** When set, shows a reassign hint if the driver has a different vehicle assigned. */
  currentVehicleId?: string;
  hideLabel?: boolean;
  inputClassName?: string;
};

export function DriverSearchCombobox({
  value,
  onChange,
  disabled,
  currentVehicleId,
  hideLabel = false,
  inputClassName,
}: DriverSearchComboboxProps) {
  const { t } = useTranslation();
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
    getHighlightedOrFirstDriver,
  } = useDriverCombobox();

  useEffect(() => {
    if (value) {
      setInputValue(formatDriverLabel(value));
    }
  }, [value?.id, value?.first_name, value?.last_name, value?.phone, setInputValue]);

  const handleInputChange = (next: string) => {
    setInputValue(next);
    if (value) onChange(null);
  };

  const selectDriver = (d: DriverListItem) => {
    onChange(d);
    setInputValue(formatDriverLabel(d));
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
      const pick = getHighlightedOrFirstDriver();
      if (pick) selectDriver(pick);
      else setOpen(false);
    }
  };

  const activeDescendantId =
    open && highlightedIndex >= 0 && results[highlightedIndex]
      ? `${listboxId}-opt-${highlightedIndex}`
      : undefined;

  const defaultInputClass =
    "w-full rounded-xl border border-white/50 bg-white/70 px-3 py-2.5 text-sm text-ink shadow-inner outline-none ring-brand/30 backdrop-blur-sm placeholder:text-slate-400 focus:border-brand/30/80 focus:ring-2";

  return (
    <div ref={rootRef} className="relative">
      {!hideLabel && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-ink">
          {t("pages.searchCombobox.driverRequiredLabel")}
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
        placeholder={t("pages.searchCombobox.searchByNamePhoneIdPlaceholder")}
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
            aria-label={t("pages.searchCombobox.closeDriverListAria")}
            onClick={() => setOpen(false)}
          />
          <ul
            id={listboxId}
            role="listbox"
            className="fixed inset-x-0 bottom-0 z-[60] max-h-[min(78vh,640px)] overflow-auto rounded-t-2xl border border-white/50 bg-white/90 py-1 shadow-2xl backdrop-blur-lg ring-1 ring-slate-900/5 md:absolute md:inset-x-auto md:bottom-auto md:left-0 md:right-0 md:top-full md:z-20 md:mt-1 md:max-h-60 md:rounded-xl"
          >
            <li
              role="presentation"
              className="sticky top-0 z-10 border-b border-border/80 bg-white/95 px-3 py-2 text-center text-xs font-medium text-ink-muted backdrop-blur-sm md:hidden"
            >
              {t("pages.searchCombobox.selectADriverText")}
            </li>
            {isFetching && (
              <li role="presentation" className="px-3 py-4 flex items-center justify-center gap-2 text-sm text-ink-muted">
                <span
                  className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-border border-t-sky-600"
                  aria-hidden
                />
                {t("pages.searchCombobox.loadingDriversEllipsis")}
              </li>
            )}
            {!isFetching && isError && (
              <li role="presentation" className="px-3 py-3 text-center text-sm text-red-600">
                {t("pages.searchCombobox.couldNotLoadDrivers")}{" "}
                <button type="button" className="font-medium text-brand underline" onClick={() => refetch()}>
                  {t("common.retry")}
                </button>
              </li>
            )}
            {!isFetching && !isError && results.length === 0 && (
              <li role="presentation" className="px-3 py-4 text-center text-sm text-ink-muted">
                {t("pages.searchCombobox.noDriversMatchSearch")}
              </li>
            )}
            {!isFetching &&
              !isError &&
              results.map((d, i) => {
                const active = i === highlightedIndex;
                const isReassign =
                  !!d.current_vehicle_id &&
                  (!currentVehicleId || d.current_vehicle_id !== currentVehicleId);
                return (
                  <li
                    key={d.id}
                    id={`${listboxId}-opt-${i}`}
                    role="option"
                    aria-selected={value?.id === d.id}
                    className={`cursor-pointer px-3 py-2.5 text-sm ${
                      active ? "bg-brand-mint/90 text-ink" : "text-ink hover:bg-white/60"
                    }`}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectDriver(d);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {d.first_name} {d.last_name}
                      </span>
                      {isReassign && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                          {t("pages.searchCombobox.reassignBadge")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-muted tabular-nums">{d.phone}</div>
                  </li>
                );
              })}
          </ul>
        </>
      )}
    </div>
  );
}
