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
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", opts)}`;
}

export function formatTrendDelta(delta: number, unit: string): { text: string; positive: boolean | undefined } {
  if (delta === 0) return { text: `No change ${unit}`, positive: undefined };
  const sign = delta > 0 ? "+" : "";
  return { text: `${sign}${delta} ${unit}`, positive: delta > 0 };
}
