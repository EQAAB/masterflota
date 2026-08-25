import type { SubcontractorSettlementDetailDriver } from "../../../../api/subcontractorPayouts";
import i18n from "../../../../i18n";

export type FooterTotals = {
  gross: number;
  tips: number;
  commission: number;
  vehicle_rent: number;
  account_opening_fee: number;
  platform_fees: number;
  daily_cash: number;
  custom_deductions: number;
  custom_additions: number;
  raw_net: number;
  debt_applied: number;
  net: number;
};

export type DriverMetricKey = keyof Omit<FooterTotals, never>;

export type SettlementDriverColumnKey = Exclude<DriverMetricKey, "net">;

export type SettlementDriverColumn = {
  key: SettlementDriverColumnKey;
  label: string;
  shortLabel: string;
  title?: string;
  accentNegative?: boolean;
  /** Always shown in the main table (when not overridden by user hide). */
  core?: boolean;
  getDriverValue: (d: SubcontractorSettlementDetailDriver) => number;
  getFooterValue: (f: FooterTotals) => number;
};

function colT(key: SettlementDriverColumnKey, field: "label" | "short" | "title"): string {
  return i18n.t(`pages.subSettlements.driverColumns.${key}.${field}`);
}

export const SETTLEMENT_DRIVER_COLUMNS: SettlementDriverColumn[] = [
  {
    key: "gross",
    get label() { return colT("gross", "label"); },
    get shortLabel() { return colT("gross", "short"); },
    get title() { return colT("gross", "title"); },
    core: true,
    getDriverValue: (d) => Number(d.gross),
    getFooterValue: (f) => f.gross,
  },
  {
    key: "tips",
    get label() { return colT("tips", "label"); },
    get shortLabel() { return colT("tips", "short"); },
    getDriverValue: (d) => Number(d.tips),
    getFooterValue: (f) => f.tips,
  },
  {
    key: "commission",
    get label() { return colT("commission", "label"); },
    get shortLabel() { return colT("commission", "short"); },
    core: true,
    getDriverValue: (d) => Number(d.commission),
    getFooterValue: (f) => f.commission,
  },
  {
    key: "vehicle_rent",
    get label() { return colT("vehicle_rent", "label"); },
    get shortLabel() { return colT("vehicle_rent", "short"); },
    getDriverValue: (d) => Number(d.vehicle_rent),
    getFooterValue: (f) => f.vehicle_rent,
  },
  {
    key: "account_opening_fee",
    get label() { return colT("account_opening_fee", "label"); },
    get shortLabel() { return colT("account_opening_fee", "short"); },
    getDriverValue: (d) => Number(d.account_opening_fee),
    getFooterValue: (f) => f.account_opening_fee,
  },
  {
    key: "platform_fees",
    get label() { return colT("platform_fees", "label"); },
    get shortLabel() { return colT("platform_fees", "short"); },
    getDriverValue: (d) => Number(d.platform_fees),
    getFooterValue: (f) => f.platform_fees,
  },
  {
    key: "daily_cash",
    get label() { return colT("daily_cash", "label"); },
    get shortLabel() { return colT("daily_cash", "short"); },
    accentNegative: true,
    getDriverValue: (d) => Number(d.daily_cash),
    getFooterValue: (f) => f.daily_cash,
  },
  {
    key: "custom_deductions",
    get label() { return colT("custom_deductions", "label"); },
    get shortLabel() { return colT("custom_deductions", "short"); },
    accentNegative: true,
    getDriverValue: (d) => Number(d.custom_deductions),
    getFooterValue: (f) => f.custom_deductions,
  },
  {
    key: "custom_additions",
    get label() { return colT("custom_additions", "label"); },
    get shortLabel() { return colT("custom_additions", "short"); },
    getDriverValue: (d) => Number(d.custom_additions),
    getFooterValue: (f) => f.custom_additions,
  },
  {
    key: "raw_net",
    get label() { return colT("raw_net", "label"); },
    get shortLabel() { return colT("raw_net", "short"); },
    get title() { return colT("raw_net", "title"); },
    core: true,
    getDriverValue: (d) => Number(d.raw_net),
    getFooterValue: (f) => f.raw_net,
  },
  {
    key: "debt_applied",
    get label() { return colT("debt_applied", "label"); },
    get shortLabel() { return colT("debt_applied", "short"); },
    get title() { return colT("debt_applied", "title"); },
    accentNegative: true,
    getDriverValue: (d) => Number(d.debt_applied),
    getFooterValue: (f) => f.debt_applied,
  },
];

const COLUMN_STORAGE_KEY = "fleet:settlement-detail-driver-columns";

export type ColumnVisibilityPrefs = {
  /** User forced visible (even when settlement total is zero). */
  forcedVisible: SettlementDriverColumnKey[];
  /** User forced hidden (even when non-zero). */
  forcedHidden: SettlementDriverColumnKey[];
};

export function loadColumnVisibilityPrefs(): ColumnVisibilityPrefs {
  if (typeof window === "undefined") {
    return { forcedVisible: [], forcedHidden: [] };
  }
  try {
    const raw = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) return { forcedVisible: [], forcedHidden: [] };
    const parsed = JSON.parse(raw) as Partial<ColumnVisibilityPrefs>;
    return {
      forcedVisible: Array.isArray(parsed.forcedVisible) ? parsed.forcedVisible : [],
      forcedHidden: Array.isArray(parsed.forcedHidden) ? parsed.forcedHidden : [],
    };
  } catch {
    return { forcedVisible: [], forcedHidden: [] };
  }
}

export function saveColumnVisibilityPrefs(prefs: ColumnVisibilityPrefs): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(prefs));
}

export function isAmountNonZero(n: number): boolean {
  return Math.abs(n) >= 0.005;
}

export function resolveVisibleColumns(
  footer: FooterTotals,
  prefs: ColumnVisibilityPrefs,
): SettlementDriverColumn[] {
  return SETTLEMENT_DRIVER_COLUMNS.filter((col) => {
    if (prefs.forcedHidden.includes(col.key)) return false;
    if (prefs.forcedVisible.includes(col.key)) return true;
    if (col.core) return true;
    return isAmountNonZero(col.getFooterValue(footer));
  });
}

/** Detail panel: columns hidden from main table with a non-zero value for this driver. */
export function detailFieldsForDriver(
  driver: SubcontractorSettlementDetailDriver,
  visibleInTable: Set<SettlementDriverColumnKey>,
): SettlementDriverColumn[] {
  return SETTLEMENT_DRIVER_COLUMNS.filter((col) => {
    if (visibleInTable.has(col.key)) return false;
    return isAmountNonZero(col.getDriverValue(driver));
  });
}

export function resetColumnVisibilityPrefs(): ColumnVisibilityPrefs {
  const empty = { forcedVisible: [], forcedHidden: [] };
  saveColumnVisibilityPrefs(empty);
  return empty;
}
