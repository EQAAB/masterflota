import type { AppBranding } from "../../../lib/appBranding";
import i18n from "../../../i18n";

function statementLocale(): string {
  return (i18n.language || "en").toLowerCase().startsWith("ro") ? "ro-RO" : "en-GB";
}

export function formatStatementWeek(startIso: string, endIso: string): string {
  const start = new Date(`${startIso.slice(0, 10)}T12:00:00`);
  const end = new Date(`${endIso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startIso.slice(0, 10)} - ${endIso.slice(0, 10)}`;
  }
  const locale = statementLocale();
  const day = new Intl.DateTimeFormat(locale, { day: "numeric" });
  const monthYear = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${day.format(start)}-${day.format(end)} ${monthYear.format(end)}`;
  }
  const full = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" });
  return `${full.format(start)} - ${full.format(end)} ${end.getFullYear()}`;
}

/** dd/mm/yyyy */
export function formatStatementDay(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function statementPayoutDateIso(row: {
  consolidated_status: string;
  paid_at: string | null;
  payment_period_end: string;
}): string {
  if (row.consolidated_status === "paid" && row.paid_at) return row.paid_at;
  return row.payment_period_end;
}

export function statementFinalAmountKey(status: string, finalNet: number): string {
  if (status === "paid") return "pages.earningsPayouts.statement.finalAmountPaid";
  if (finalNet < -0.02) return "pages.earningsPayouts.statement.finalAmountDebt";
  return "pages.earningsPayouts.statement.finalAmountPayable";
}

export function statementGeneratedBy(brand: AppBranding): string {
  const raw = brand.companyUrl || brand.marketingUrl;
  const site = raw?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? "";
  const name = brand.companyName || brand.appName;
  if (site) {
    return i18n.t("pages.earningsPayouts.statement.generatedBySite", { name, site });
  }
  return i18n.t("pages.earningsPayouts.statement.generatedBy", { name });
}
