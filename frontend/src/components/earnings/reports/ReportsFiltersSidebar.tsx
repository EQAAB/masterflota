import { useTranslation } from "react-i18next";
import { transitionDefault } from "../../../theme/classNames";

export type ReportsFilterValues = {
  from: string;
  to: string;
  q: string;
  status: string;
  minVehicleRental: string;
  platform: string;
};

type ReportsFiltersSidebarProps = {
  className?: string;
  filters: ReportsFilterValues;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onQChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onMinVehicleRentalChange: (v: string) => void;
  onPlatformChange: (v: string) => void;
  onReset: () => void;
};

const filterCardClass =
  `rounded-[18px] border border-border/70 bg-white p-4 shadow-soft flex flex-col gap-3 ${transitionDefault}`;

const filterLabelClass = "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-muted";

const filterInputClass =
  "w-full h-[42px] rounded-xl border border-border/80 bg-white px-3 text-sm text-ink shadow-sm outline-none " +
  "transition-all duration-200 ease-out placeholder:text-ink-muted " +
  "hover:border-border hover:bg-slate-50/90 " +
  "focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

function hasActiveFilters(filters: ReportsFilterValues): boolean {
  return Boolean(
    filters.from ||
      filters.to ||
      filters.q.trim() ||
      filters.status ||
      filters.minVehicleRental.trim() ||
      filters.platform,
  );
}

function FunnelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 4h18M6 12h12M10 20h4" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
      />
    </svg>
  );
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M5 17h14M6 17l1-5h10l1 5M7 12l1.5-4h7L17 12"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ResetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M4 4v5h5M20 20v-5h-5M20 9A8 8 0 006.34 6.34M4 15a8 8 0 0013.66 2.66"
      />
    </svg>
  );
}

function FilterFieldLabel({ children }: { children: React.ReactNode }) {
  return <span className={filterLabelClass}>{children}</span>;
}

function IconWrap({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute right-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-ink-muted">
      {children}
    </span>
  );
}

function DateRangeField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label htmlFor={id} className="block min-w-0">
      <span className="mb-1 block text-[10px] font-medium text-ink-muted">{label}</span>
      <div className="relative">
        <input
          id={id}
          type="date"
          className={`${filterInputClass} pr-9`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <IconWrap>
          <CalendarIcon className="h-4 w-4" />
        </IconWrap>
      </div>
    </label>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="block">
      <FilterFieldLabel>{label}</FilterFieldLabel>
      <div className="relative">
        <select
          id={id}
          className={`${filterInputClass} appearance-none pr-9`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {children}
        </select>
        <IconWrap>
          <ChevronDownIcon className="h-4 w-4" />
        </IconWrap>
      </div>
    </label>
  );
}

function FilterInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon,
  min,
  step,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  min?: number;
  step?: string;
}) {
  return (
    <label htmlFor={id} className="block">
      <FilterFieldLabel>{label}</FilterFieldLabel>
      <div className="relative">
        <input
          id={id}
          type={type}
          className={`${filterInputClass} ${icon ? "pr-9" : ""}`}
          value={value}
          placeholder={placeholder}
          min={min}
          step={step}
          onChange={(e) => onChange(e.target.value)}
        />
        {icon && <IconWrap>{icon}</IconWrap>}
      </div>
    </label>
  );
}

export function ReportsFiltersSidebar({
  className = "",
  filters,
  onFromChange,
  onToChange,
  onQChange,
  onStatusChange,
  onMinVehicleRentalChange,
  onPlatformChange,
  onReset,
}: ReportsFiltersSidebarProps) {
  const { t } = useTranslation();
  const active = hasActiveFilters(filters);

  return (
    <aside className={`${filterCardClass} ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-mint/80 text-brand shadow-sm ring-1 ring-brand/10">
            <FunnelIcon className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold tracking-tight text-ink">{t("pages.earningsReports.filtersTitle")}</h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={!active}
          className="shrink-0 text-xs font-medium text-brand transition-colors hover:text-brand/80 disabled:cursor-default disabled:text-ink-muted/60 disabled:no-underline enabled:hover:underline"
        >
          {t("pages.earningsReports.clearAll")}
        </button>
      </div>

      <div className="space-y-2.5">
        <div className="rounded-xl border border-brand-mint/60 bg-brand-mint/25 p-2.5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-brand/90">{t("pages.earningsReports.dateRange")}</p>
          <div className="grid grid-cols-1 gap-2">
            <DateRangeField id="reports-from" label={t("pages.earningsReports.fromLabel")} value={filters.from} onChange={onFromChange} />
            <DateRangeField id="reports-to" label={t("pages.earningsReports.toLabel")} value={filters.to} onChange={onToChange} />
          </div>
        </div>

        <FilterSelect id="reports-status" label={t("common.status")} value={filters.status} onChange={onStatusChange}>
          <option value="">{t("pages.earningsReports.allStatusesOption")}</option>
          <option value="pending">{t("pages.earningsReports.statusPending")}</option>
          <option value="processing">{t("pages.earningsReports.statusProcessing")}</option>
          <option value="approved">{t("pages.earningsReports.statusApproved")}</option>
          <option value="paid">{t("status.paid")}</option>
          <option value="failed">{t("pages.earningsReports.statusFailed")}</option>
          <option value="hold">{t("pages.earningsReports.statusHold")}</option>
          <option value="debt">{t("status.debt")}</option>
        </FilterSelect>

        <FilterInput
          id="reports-driver-search"
          label={t("pages.earningsReports.driverSearchLabel")}
          type="search"
          value={filters.q}
          onChange={onQChange}
          placeholder={t("pages.earningsReports.driverSearchPlaceholder")}
          icon={<SearchIcon className="h-4 w-4" />}
        />

        <FilterInput
          id="reports-min-rental"
          label={t("pages.earningsReports.vehicleRentalOverX")}
          type="number"
          min={0}
          step="0.01"
          value={filters.minVehicleRental}
          onChange={onMinVehicleRentalChange}
          placeholder="0.00"
          icon={<CarIcon className="h-4 w-4" />}
        />

        <FilterSelect
          id="reports-platform"
          label={t("pages.earningsReports.earningsPlatformLabel")}
          value={filters.platform}
          onChange={onPlatformChange}
        >
          <option value="">{t("pages.earningsReports.allPlatformsOption")}</option>
          <option value="glovo">Glovo</option>
          <option value="bolt">Bolt</option>
          <option value="bolt_taxi">Bolt Taxi</option>
          <option value="uber">Uber</option>
        </FilterSelect>
      </div>

      <button
        type="button"
        onClick={onReset}
        className={
          "mt-0.5 inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-border/80 bg-white text-sm font-medium text-ink shadow-sm " +
          transitionDefault +
          " hover:border-brand/30 hover:bg-slate-50 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
        }
      >
        <ResetIcon className="h-4 w-4 text-ink-muted" />
        {t("pages.earningsReports.resetFilters")}
      </button>
    </aside>
  );
}
