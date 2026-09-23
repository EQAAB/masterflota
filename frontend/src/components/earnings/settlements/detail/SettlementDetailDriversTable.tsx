import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SubcontractorSettlementDetailDriver } from "../../../../api/subcontractorPayouts";
import { formatCurrency } from "../../../../utils/currency";
import { earningsPlatformLabel } from "../../../../utils/earningsPlatformLabel";
import { transitionDefault } from "../../../../theme/classNames";
import { moneyAccentClass } from "./settlementDetailDisplayUtils";
import {
  detailFieldsForDriver,
  loadColumnVisibilityPrefs,
  resetColumnVisibilityPrefs,
  resolveVisibleColumns,
  saveColumnVisibilityPrefs,
  SETTLEMENT_DRIVER_COLUMNS,
  type ColumnVisibilityPrefs,
  type FooterTotals,
  type SettlementDriverColumn,
  type SettlementDriverColumnKey,
} from "./settlementDriverTableConfig";

const scrollShellClass =
  "max-h-[min(68vh,720px)] overflow-auto overscroll-contain scroll-smooth " +
  "[scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:rgb(148_163_184)_rgb(241_245_249)] " +
  "[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 " +
  "[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100/90 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 " +
  "[&::-webkit-scrollbar-thumb]:hover:bg-slate-400";

const thClass =
  "px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap";
const tdClass = "px-2.5 py-2.5 text-sm align-middle";

const stickyExpandTh = `${thClass} w-10 sticky left-0 z-20 bg-[#F8FAFC]`;
const stickyExpandTd = `${tdClass} w-10 sticky left-0 z-10 bg-white`;
const stickyDriverTh = `${thClass} sticky left-10 z-20 min-w-[120px] max-w-[180px] bg-[#F8FAFC] shadow-[4px_0_8px_-4px_rgba(15,23,42,0.08)]`;
const stickyDriverTd = `${tdClass} sticky left-10 z-10 min-w-[120px] max-w-[180px] truncate bg-white font-medium text-slate-900 shadow-[4px_0_8px_-4px_rgba(15,23,42,0.06)]`;
const stickyDriverTdHover = "group-hover:bg-slate-50/80";
const stickyNetTh = `${thClass} text-right sticky right-0 z-20 min-w-[88px] bg-[#F8FAFC] shadow-[-4px_0_8px_-4px_rgba(15,23,42,0.08)]`;
const stickyNetTd = `${tdClass} text-right sticky right-0 z-10 min-w-[88px] bg-white font-medium shadow-[-4px_0_8px_-4px_rgba(15,23,42,0.06)]`;

type DetailTint = "emerald" | "slate" | "orange" | "blue" | "purple" | "indigo" | "teal";

const detailTintClass: Record<DetailTint, string> = {
  emerald: "border-emerald-100/80 bg-emerald-50/90",
  slate: "border-slate-200/80 bg-slate-50/90",
  orange: "border-orange-100/80 bg-orange-50/90",
  blue: "border-blue-100/80 bg-blue-50/90",
  purple: "border-purple-100/80 bg-purple-50/90",
  indigo: "border-indigo-100/80 bg-indigo-50/90",
  teal: "border-teal-100/80 bg-teal-50/90",
};

const detailTintByKey: Partial<Record<SettlementDriverColumnKey, DetailTint>> = {
  tips: "emerald",
  vehicle_rent: "slate",
  account_opening_fee: "teal",
  platform_fees: "orange",
  daily_cash: "blue",
  custom_deductions: "purple",
  custom_additions: "indigo",
  raw_net: "slate",
  debt_applied: "orange",
};

function MoneyCell({
  amount,
  accentNegative = false,
  className = "",
}: {
  amount: number;
  accentNegative?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`tabular-nums whitespace-nowrap ${moneyAccentClass(amount, accentNegative)} ${className}`}
      style={{ fontFeatureSettings: '"tnum"' }}
    >
      {formatCurrency(amount)}
    </span>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function settlementDriverPlatformLine(d: SubcontractorSettlementDetailDriver): string | null {
  const platform = d.platform?.trim();
  const platformId = d.platform_id?.trim();
  if (!platform && !platformId) return null;
  const label = platform ? earningsPlatformLabel(platform) : null;
  if (label && platformId) return `${label} · ${platformId}`;
  if (platformId) return platformId;
  return label;
}

function ColumnsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 4.5v15m6-15v15M4.5 9h15M4.5 15h15"
      />
    </svg>
  );
}

function DetailField({ label, value, tint = "slate" }: { label: string; value: string; tint?: DetailTint }) {
  return (
    <div className={`min-w-0 rounded-xl border px-3 py-2.5 ${detailTintClass[tint]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">{label}</p>
      <p
        className="mt-1 whitespace-nowrap text-sm font-semibold tabular-nums text-slate-900"
        style={{ fontFeatureSettings: '"tnum"' }}
      >
        {value}
      </p>
    </div>
  );
}

function ColumnPicker({
  footer,
  prefs,
  onChange,
}: {
  footer: FooterTotals;
  prefs: ColumnVisibilityPrefs;
  onChange: (next: ColumnVisibilityPrefs) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function isAutoVisible(key: SettlementDriverColumnKey): boolean {
    const col = SETTLEMENT_DRIVER_COLUMNS.find((c) => c.key === key);
    if (!col) return false;
    if (col.core) return true;
    return Math.abs(col.getFooterValue(footer)) >= 0.005;
  }

  function toggleForcedVisible(key: SettlementDriverColumnKey) {
    const forcedVisible = prefs.forcedVisible.includes(key)
      ? prefs.forcedVisible.filter((k) => k !== key)
      : [...prefs.forcedVisible, key];
    const forcedHidden = prefs.forcedHidden.filter((k) => k !== key);
    onChange({ forcedVisible, forcedHidden });
  }

  function toggleForcedHidden(key: SettlementDriverColumnKey) {
    const forcedHidden = prefs.forcedHidden.includes(key)
      ? prefs.forcedHidden.filter((k) => k !== key)
      : [...prefs.forcedHidden, key];
    const forcedVisible = prefs.forcedVisible.filter((k) => k !== key);
    onChange({ forcedVisible, forcedHidden });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <ColumnsIcon className="h-3.5 w-3.5" />
        {t("pages.subSettlements.columnsButton")}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-black/5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t("pages.subSettlements.tableColumnsTitle")}</p>
          <p className="mt-1 text-xs leading-snug text-slate-500">
            {t("pages.subSettlements.zeroTotalsHint")}
          </p>
          <ul className="mt-2.5 max-h-56 space-y-1 overflow-y-auto">
            {SETTLEMENT_DRIVER_COLUMNS.map((col) => {
              const auto = isAutoVisible(col.key);
              const visible = prefs.forcedHidden.includes(col.key)
                ? false
                : prefs.forcedVisible.includes(col.key) || auto;
              return (
                <li
                  key={col.key}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                >
                  <span className="min-w-0 truncate text-sm text-slate-800" title={col.label}>
                    {col.shortLabel}
                    {col.core && <span className="ml-1 text-[10px] text-slate-400">{t("pages.subSettlements.coreLabel")}</span>}
                    {!auto && !col.core && (
                      <span className="ml-1 text-[10px] text-slate-400">{t("pages.subSettlements.zeroLabel")}</span>
                    )}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      title={t("pages.subSettlements.showColumnTitle")}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        visible ? "bg-brand-mint text-brand" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                      onClick={() => toggleForcedVisible(col.key)}
                    >
                      {t("pages.subSettlements.onLabel")}
                    </button>
                    <button
                      type="button"
                      title={t("pages.subSettlements.hideColumnTitle")}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        !visible ? "bg-slate-200 text-slate-800" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                      onClick={() => toggleForcedHidden(col.key)}
                    >
                      {t("pages.subSettlements.offLabel")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="mt-2.5 w-full rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            onClick={() => onChange(resetColumnVisibilityPrefs())}
          >
            {t("pages.subSettlements.resetToAuto")}
          </button>
        </div>
      )}
    </div>
  );
}

function DriverRowDetailPanel({
  driver,
  visibleInTable,
}: {
  driver: SubcontractorSettlementDetailDriver;
  visibleInTable: Set<SettlementDriverColumnKey>;
}) {
  const { t } = useTranslation();
  const fields = detailFieldsForDriver(driver, visibleInTable);
  if (fields.length === 0) {
    return <p className="text-xs text-slate-500">{t("pages.subSettlements.noAdditionalLineItems")}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {fields.map((col) => (
        <DetailField
          key={col.key}
          label={col.label}
          tint={detailTintByKey[col.key] ?? "slate"}
          value={formatCurrency(col.getDriverValue(driver))}
        />
      ))}
    </div>
  );
}

function MetricCells({
  col,
  driver,
  footer,
  rowKind,
}: {
  col: SettlementDriverColumn;
  driver?: SubcontractorSettlementDetailDriver;
  footer?: FooterTotals;
  rowKind: "body" | "foot";
}) {
  const amount =
    rowKind === "foot" && footer
      ? col.getFooterValue(footer)
      : driver
        ? col.getDriverValue(driver)
        : 0;

  return (
    <td className={`${tdClass} text-right`}>
      <MoneyCell amount={amount} accentNegative={col.accentNegative} />
    </td>
  );
}

type SettlementDetailDriversTableProps = {
  drivers: SubcontractorSettlementDetailDriver[];
  footer: FooterTotals;
};

export function SettlementDetailDriversTable({ drivers, footer }: SettlementDetailDriversTableProps) {
  const { t } = useTranslation();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [columnPrefs, setColumnPrefs] = useState<ColumnVisibilityPrefs>(() => loadColumnVisibilityPrefs());

  const visibleColumns = useMemo(
    () => resolveVisibleColumns(footer, columnPrefs),
    [footer, columnPrefs],
  );
  const visibleKeySet = useMemo(
    () => new Set(visibleColumns.map((c) => c.key)),
    [visibleColumns],
  );

  function updateColumnPrefs(next: ColumnVisibilityPrefs) {
    setColumnPrefs(next);
    saveColumnVisibilityPrefs(next);
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const colSpan = 3 + visibleColumns.length;

  return (
    <div
      className={`overflow-hidden rounded-[16px] border border-border/70 bg-white shadow-soft ${transitionDefault}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-800">{t("pages.subSettlements.driverBreakdownTitle")}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {t("pages.subSettlements.compactViewHint")}
          </p>
        </div>
        <ColumnPicker footer={footer} prefs={columnPrefs} onChange={updateColumnPrefs} />
      </div>

      <div className="relative">
        <div className={scrollShellClass}>
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-30 border-b border-slate-200 bg-[#F8FAFC] text-left">
            <tr>
              <th className={stickyExpandTh} aria-label={t("pages.subSettlements.expandRowAria")}>
                <span className="sr-only">{t("pages.subSettlements.expandSr")}</span>
              </th>
              <th className={stickyDriverTh}>{t("pages.driversList.colDriver")}</th>
              {visibleColumns.map((col) => (
                <th key={col.key} className={`${thClass} text-right`} title={col.title ?? col.label}>
                  {col.shortLabel}
                </th>
              ))}
              <th className={stickyNetTh}>Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90">
            {drivers.map((d) => {
              const expanded = expandedIds.has(d.id);
              const platformLine = settlementDriverPlatformLine(d);
              return (
                <Fragment key={d.id}>
                  <tr className="group bg-white transition-colors duration-150 hover:bg-slate-50/80">
                    <td className={`${stickyExpandTd} ${stickyDriverTdHover}`}>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100"
                        onClick={() => toggleExpanded(d.id)}
                        aria-expanded={expanded}
                        aria-label={expanded ? t("pages.subSettlements.collapseDriverDetailsAria") : t("pages.subSettlements.expandDriverDetailsAria")}
                      >
                        <ChevronIcon expanded={expanded} />
                      </button>
                    </td>
                    <td
                      className={`${stickyDriverTd} ${stickyDriverTdHover}`}
                      title={[d.name, platformLine].filter(Boolean).join(" · ")}
                    >
                      <span className="block truncate">{d.name || t("common.emDash")}</span>
                      {platformLine && (
                        <span className="mt-0.5 block truncate text-[11px] font-normal text-slate-500">
                          {platformLine}
                        </span>
                      )}
                    </td>
                    {visibleColumns.map((col) => (
                      <MetricCells key={col.key} col={col} driver={d} rowKind="body" />
                    ))}
                    <td className={`${stickyNetTd} ${stickyDriverTdHover}`}>
                      <MoneyCell amount={Number(d.net)} />
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="bg-slate-50/70">
                      <td colSpan={colSpan} className="border-t border-slate-100/80 px-4 py-3 sm:px-5">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          {t("pages.subSettlements.driverDetailSuffix", { name: d.name || t("pages.subSettlements.driverFallback") })}
                        </p>
                        <DriverRowDetailPanel driver={d} visibleInTable={visibleKeySet} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
          {drivers.length > 0 && (
            <tfoot className="border-t-2 border-slate-200 bg-slate-50/90 font-semibold text-slate-900">
              <tr>
                <td className={`${tdClass} bg-slate-50/90`} />
                <td className={`${tdClass} sticky left-10 z-10 min-w-[120px] bg-slate-50/90 text-slate-800 shadow-[4px_0_8px_-4px_rgba(15,23,42,0.06)]`}>
                  {t("pages.subSettlements.totalRow")}
                </td>
                {visibleColumns.map((col) => (
                  <MetricCells key={col.key} col={col} footer={footer} rowKind="foot" />
                ))}
                <td className={`${stickyNetTd} bg-slate-50/90`}>
                  <MoneyCell amount={footer.net} />
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        </div>
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white via-white/80 to-transparent"
          aria-hidden
        />
      </div>

      {drivers.length === 0 && (
        <p className="border-t border-slate-100 p-4 text-sm text-slate-500">
          {t("pages.subSettlements.noDriverPayoutsLinked")}
        </p>
      )}
    </div>
  );
}

export type { FooterTotals };
