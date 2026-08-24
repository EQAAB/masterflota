import i18n from "../../../i18n";

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatShortDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const locale = i18n.language?.startsWith("ro") ? "ro-RO" : "en-GB";
  return `${s.toLocaleDateString(locale, opts)} – ${e.toLocaleDateString(locale, opts)}`;
}

export function formatTrendDelta(delta: number, unit: string): { text: string; positive: boolean | undefined } {
  if (delta === 0) return { text: i18n.t("pages.rentalDashboard.noChangeUnit", { unit }), positive: undefined };
  const sign = delta > 0 ? "+" : "";
  return { text: i18n.t("pages.rentalDashboard.deltaUnit", { sign, delta, unit }), positive: delta > 0 };
}
