import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { btnSecondary, input, transitionDefault } from "../../../theme/classNames";
import { applyDatePreset, formatDateRangeLabel } from "./useEarningsOverviewDerived";

type EarningsOverviewDateRangeProps = {
  dateFrom: string;
  dateTo: string;
  onChange: (from: string, to: string) => void;
};

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
      />
    </svg>
  );
}

export function EarningsOverviewDateRange({ dateFrom, dateTo, onChange }: EarningsOverviewDateRangeProps) {
  const { t } = useTranslation();
  const PRESETS = [
    { id: "30d" as const, label: t("pages.earningsOverview.last30DaysPreset") },
    { id: "90d" as const, label: t("pages.earningsOverview.last90DaysPreset") },
    { id: "6mo" as const, label: t("pages.earningsOverview.last6MonthsPreset") },
  ];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${btnSecondary} gap-2 text-sm ${transitionDefault}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-ink-muted" />
        <span className="max-w-[220px] truncate sm:max-w-none">{formatDateRangeLabel(dateFrom, dateTo)}</span>
        <svg className="h-4 w-4 shrink-0 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-border bg-white p-4 shadow-card-hover">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("pages.earningsOverview.presetsLabel")}</p>
          <div className="mt-2 flex flex-col gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface"
                onClick={() => {
                  const { from, to } = applyDatePreset(p.id);
                  onChange(from, to);
                  setOpen(false);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("pages.earningsOverview.customRangeLabel")}</p>
          <div className="mt-2 space-y-2">
            <label className="block">
              <span className="text-xs text-ink-muted">{t("pages.vehicleDetail.fromLabel")}</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onChange(e.target.value, dateTo)}
                className={`${input} mt-1 text-sm`}
              />
            </label>
            <label className="block">
              <span className="text-xs text-ink-muted">{t("pages.vehicleDetail.toLabel")}</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onChange(dateFrom, e.target.value)}
                className={`${input} mt-1 text-sm`}
              />
            </label>
          </div>
          <button
            type="button"
            className={`${btnSecondary} mt-3 w-full justify-center text-sm`}
            onClick={() => setOpen(false)}
          >
            {t("pages.earningsOverview.applyButton")}
          </button>
        </div>
      )}
    </div>
  );
}
