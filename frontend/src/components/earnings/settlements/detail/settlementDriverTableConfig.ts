import type { SubcontractorSettlementDetailDriver } from "../../../../api/subcontractorPayouts";

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

export const SETTLEMENT_DRIVER_COLUMNS: SettlementDriverColumn[] = [
  {
    key: "gross",
    label: "Gross incl. tips",
    shortLabel: "Gross",
    title: "Income + tips for the period",
    core: true,
    getDriverValue: (d) => Number(d.gross),
    getFooterValue: (f) => f.gross,
  },
  {
    key: "tips",
    label: "Tips",
    shortLabel: "Tips",
    getDriverValue: (d) => Number(d.tips),
    getFooterValue: (f) => f.tips,
  },
  {
    key: "commission",
    label: "Commission",
    shortLabel: "Comm.",
    core: true,
    getDriverValue: (d) => Number(d.commission),
    getFooterValue: (f) => f.commission,
  },
  {
    key: "vehicle_rent",
    label: "Vehicle rent",
    shortLabel: "Rent",
    getDriverValue: (d) => Number(d.vehicle_rent),
    getFooterValue: (f) => f.vehicle_rent,
  },
  {
    key: "account_opening_fee",
    label: "Acct. fee",
    shortLabel: "Acct.",
    getDriverValue: (d) => Number(d.account_opening_fee),
    getFooterValue: (f) => f.account_opening_fee,
  },
  {
    key: "platform_fees",
    label: "Platform fee",
    shortLabel: "Plat.",
    getDriverValue: (d) => Number(d.platform_fees),
    getFooterValue: (f) => f.platform_fees,
  },
  {
    key: "daily_cash",
    label: "Daily cash",
    shortLabel: "Cash",
    accentNegative: true,
    getDriverValue: (d) => Number(d.daily_cash),
    getFooterValue: (f) => f.daily_cash,
  },
  {
    key: "custom_deductions",
    label: "Custom ded.",
    shortLabel: "Cust. ded.",
    accentNegative: true,
    getDriverValue: (d) => Number(d.custom_deductions),
    getFooterValue: (f) => f.custom_deductions,
  },
  {
    key: "custom_additions",
    label: "Custom add.",
    shortLabel: "Cust. add.",
    getDriverValue: (d) => Number(d.custom_additions),
    getFooterValue: (f) => f.custom_additions,
  },
  {
    key: "raw_net",
    label: "Raw net",
    shortLabel: "Raw net",
    title: "After fees and custom deductions — before debt carry-forward",
    core: true,
    getDriverValue: (d) => Number(d.raw_net),
    getFooterValue: (f) => f.raw_net,
  },
  {
    key: "debt_applied",
    label: "Debt applied",
    shortLabel: "Debt",
    title: "Applied from this period to older driver debt",
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
