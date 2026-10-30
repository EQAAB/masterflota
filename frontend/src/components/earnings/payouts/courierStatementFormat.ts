import type { AppBranding } from "../../../lib/appBranding";
import i18n from "../../../i18n";

/** Platform ID for the statement, including Uber and Bolt Taxi UUIDs. */
export function statementDisplayId(id: string | null | undefined): string {
  return id?.trim() || "-";
}

type PlatformIdSource = {
  earnings_platform?: string | null;
  platform_id?: string | null;
  uber_driver_id?: string | null;
  glovo_courier_id?: string | null;
  bolt_courier_id?: string | null;
  bolt_driver_id?: string | null;
  bolt_taxi_driver_uuid?: string | null;
  wolt_courier_id?: string | null;
};

function firstId(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

/** Driver platform ID for this payout leg: uber_driver_id, glovo_courier_id, and the matching Bolt/Wolt field. */
export function payoutItemPlatformId(item: PlatformIdSource): string {
  const code = (item.earnings_platform ?? "").trim().toLowerCase();
  if (code === "uber") return firstId(item.uber_driver_id, item.platform_id);
  if (code === "glovo") return firstId(item.glovo_courier_id, item.platform_id);
  if (code === "bolt" || code === "bolt_courier") {
    return firstId(item.bolt_courier_id, item.bolt_driver_id, item.platform_id);
  }
  if (code === "bolt_taxi") {
    return firstId(item.bolt_driver_id, item.bolt_courier_id, item.bolt_taxi_driver_uuid, item.platform_id);
  }
  if (code === "wolt" || code === "wolt_courier") return firstId(item.wolt_courier_id, item.platform_id);
  return firstId(item.platform_id);
}

/** One ID on the summary line. Several platforms keep their IDs on the platform rows. */
export function statementSummaryId(ids: string[], multiPlatform: boolean): string {
  if (multiPlatform || ids.length !== 1) return "-";
  return statementDisplayId(ids[0]);
}

/**
 * Traceable statement number: PS-<week start yyyymmdd>-<first 8 hex of the payout id>.
 * Uses the driver payment when paid, otherwise the first platform payout.
 */
export function statementReference(row: {
  payment_period_start: string;
  driver_payment_id: string | null;
  platform_payout_ids: string[];
}): string {
  const id = row.driver_payment_id ?? row.platform_payout_ids[0] ?? "";
  const tail = id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const week = row.payment_period_start.slice(0, 10).replace(/-/g, "");
  return tail ? `PS-${week}-${tail}` : "-";
}

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
