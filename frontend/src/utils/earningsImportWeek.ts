import type { EarningsImportListItem } from "../api/earnings";

export function localIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD in local calendar (no UTC shift). */
export function parseLocalIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return localIsoDate(d) === iso.trim() ? d : null;
}

/** Calendar Monday on or before `d` (local time). */
export function startOfWeekMonday(d: Date): Date {
  const daysSinceMonday = d.getDay() === 0 ? 6 : d.getDay() - 1;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  monday.setDate(monday.getDate() - daysSinceMonday);
  return monday;
}

/**
 * Previous full Monday–Sunday week (local calendar).
 * Example: today Mon May 25, 2026 → May 18–24.
 */
export function getPreviousWeek(today = new Date()): { start: string; end: string } {
  const thisMonday = startOfWeekMonday(today);
  const prevMonday = new Date(thisMonday);
  prevMonday.setDate(thisMonday.getDate() - 7);
  const prevSunday = new Date(prevMonday);
  prevSunday.setDate(prevMonday.getDate() + 6);
  return { start: localIsoDate(prevMonday), end: localIsoDate(prevSunday) };
}

/** Shift a Monday–Sunday pay period by whole weeks. Returns null if dates are invalid. */
export function shiftPaymentWeek(
  start: string,
  end: string,
  weeks: -1 | 1,
): { start: string; end: string } | null {
  const startD = parseLocalIsoDate(start);
  const endD = parseLocalIsoDate(end);
  if (!startD || !endD) return null;

  const delta = weeks * 7;
  const newStart = new Date(startD);
  newStart.setDate(newStart.getDate() + delta);
  const newEnd = new Date(endD);
  newEnd.setDate(newEnd.getDate() + delta);
  return { start: localIsoDate(newStart), end: localIsoDate(newEnd) };
}

/** False when advancing one week would include the current or a future calendar week. */
export function canAdvancePaymentWeek(start: string, end: string, today = new Date()): boolean {
  const shifted = shiftPaymentWeek(start, end, 1);
  if (!shifted) return false;
  const endD = parseLocalIsoDate(shifted.end);
  if (!endD) return false;
  const thisMonday = startOfWeekMonday(today);
  return endD < thisMonday;
}

export type PaymentWeekValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type ValidatePaymentWeekOptions = {
  today?: Date;
  /** When set, warn if a non-reverted import exists for the same week (and platform if provided). */
  existingImports?: EarningsImportListItem[];
  platform?: string;
};

export function importsForPaymentWeek(
  imports: EarningsImportListItem[],
  start: string,
  end: string,
  platform?: string,
): EarningsImportListItem[] {
  const s = start.slice(0, 10);
  const e = end.slice(0, 10);
  return imports.filter((imp) => {
    if (imp.status === "reverted") return false;
    if (imp.week_start.slice(0, 10) !== s || imp.week_end.slice(0, 10) !== e) return false;
    if (platform && imp.platform !== platform) return false;
    return true;
  });
}

export function validatePaymentWeek(
  start: string,
  end: string,
  opts?: ValidatePaymentWeekOptions,
): PaymentWeekValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const today = opts?.today ?? new Date();
  const thisMonday = startOfWeekMonday(today);

  if (!start.trim() || !end.trim()) {
    errors.push("Period start and end are required.");
    return { valid: false, errors, warnings };
  }

  const startD = parseLocalIsoDate(start);
  const endD = parseLocalIsoDate(end);
  if (!startD || !endD) {
    errors.push("Use valid dates (YYYY-MM-DD).");
    return { valid: false, errors, warnings };
  }

  if (startD > endD) {
    errors.push("Period start must be on or before period end.");
  }

  if (startD.getDay() !== 1) {
    errors.push("Period start must be a Monday.");
  }
  if (endD.getDay() !== 0) {
    errors.push("Period end must be a Sunday.");
  }

  const daySpan = Math.round((endD.getTime() - startD.getTime()) / 86_400_000);
  if (daySpan !== 6) {
    errors.push("Pay period must be exactly one week (Monday through Sunday, 6 days apart).");
  }

  if (endD >= thisMonday) {
    warnings.push("Selected week includes the current or a future calendar week.");
  }

  const existing = opts?.existingImports ?? [];
  if (existing.length > 0) {
    const hits = importsForPaymentWeek(existing, start, end, opts?.platform);
    if (hits.length > 0) {
      const names = hits
        .slice(0, 3)
        .map((h) => h.file_name ?? h.platform)
        .join(", ");
      const more = hits.length > 3 ? ` (+${hits.length - 3} more)` : "";
      warnings.push(
        `This week already has ${hits.length} import(s) for this provider${names ? `: ${names}${more}` : ""}.`,
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
