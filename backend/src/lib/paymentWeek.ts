/** Shared Monday–Sunday pay week helpers (earnings import + settlements). */

export function localIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfWeekMonday(d: Date): Date {
  const daysSinceMonday = d.getDay() === 0 ? 6 : d.getDay() - 1;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  monday.setDate(monday.getDate() - daysSinceMonday);
  return monday;
}

/** Previous full Monday–Sunday week in local calendar. */
export function getPreviousWeek(today = new Date()): { start: string; end: string } {
  const thisMonday = startOfWeekMonday(today);
  const prevMonday = new Date(thisMonday);
  prevMonday.setDate(thisMonday.getDate() - 7);
  const prevSunday = new Date(prevMonday);
  prevSunday.setDate(prevMonday.getDate() + 6);
  return { start: localIsoDate(prevMonday), end: localIsoDate(prevSunday) };
}
