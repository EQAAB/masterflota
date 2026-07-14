import { localIsoDate, parseLocalIsoDate, startOfWeekMonday } from "./earningsImportWeek";

export type DashboardDatePreset = "today" | "week" | "month" | "custom";

export type DashboardDateRange = {
  from: string;
  to: string;
};

/** Resolve dashboard filter presets to inclusive YYYY-MM-DD bounds (local calendar). */
export function resolveDashboardDateRange(
  preset: DashboardDatePreset,
  customDate: string,
  today = new Date(),
): DashboardDateRange {
  const todayIso = localIsoDate(today);

  if (preset === "today") {
    return { from: todayIso, to: todayIso };
  }

  if (preset === "week") {
    const monday = startOfWeekMonday(today);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: localIsoDate(monday), to: localIsoDate(sunday) };
  }

  if (preset === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: localIsoDate(start), to: localIsoDate(end) };
  }

  const parsed = parseLocalIsoDate(customDate);
  if (!parsed) {
    return { from: todayIso, to: todayIso };
  }
  const iso = localIsoDate(parsed);
  return { from: iso, to: iso };
}

export function formatDashboardRangeLabel(range: DashboardDateRange): string {
  if (range.from === range.to) return range.from;
  return `${range.from} → ${range.to}`;
}
