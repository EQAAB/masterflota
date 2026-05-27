import type { EarningsImportListItem } from "../../../api/earnings";
import { importProcessedRows, importTotalRows } from "../../../api/earnings";
import type { PlatformBadgeKey } from "../../drivers/platformLogos";

export function formatImportDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatImportTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const t = iso.includes("T") ? iso.split("T")[1]?.slice(0, 8) : "";
    return t ?? "";
  }
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatPeriodDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const datePart = iso.slice(0, 10);
  const d = new Date(datePart + "T12:00:00");
  if (Number.isNaN(d.getTime())) return datePart;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function importProgressPct(row: EarningsImportListItem): number {
  const total = importTotalRows(row);
  const processed = importProcessedRows(row);
  if (total <= 0) return 0;
  return Math.round((processed / total) * 100);
}

export type ImportStatusTone = "success" | "warning" | "muted" | "purple";

export function importStatusDisplay(status: string): { label: string; tone: ImportStatusTone } {
  switch (status) {
    case "completed":
      return { label: "Completed", tone: "success" };
    case "reverted":
      return { label: "Reverted", tone: "purple" };
    case "preview":
      return { label: "Preview", tone: "warning" };
    case "failed":
      return { label: "Failed", tone: "muted" };
    default:
      return { label: status.charAt(0).toUpperCase() + status.slice(1), tone: "muted" };
  }
}

export function earningsPlatformToBadgeKey(platform: string): PlatformBadgeKey | null {
  const p = platform.toLowerCase();
  if (p === "uber") return "uber";
  if (p === "glovo") return "glovo";
  if (p === "bolt_taxi") return "bolt_taxi";
  if (p === "bolt" || p === "bolt_courier") return "bolt";
  if (p === "wolt_courier") return "wolt";
  return null;
}

export function formatFileSizeLabel(_fileName: string | null | undefined): string {
  return "—";
}

const TEMPLATE_HEADERS = [
  "driver_id",
  "trip_date",
  "gross_earnings",
  "tips",
  "company_commission",
  "driver_payout",
  "daily_cash",
];

/** Uber Romania taxi weekly export column headers (production shape). */
const UBER_TAXI_TEMPLATE_HEADERS = [
  "Identificatorul universal unic (UUID) al șoferului",
  "Prenumele șoferului",
  "Numele de familie al șoferului",
  "Câștiguri primite",
  "Câștiguri primite : Câștigurile tale",
  "Câștiguri primite:Câștigurile tale:Taxă de servicii",
  "Câștiguri primite : Sold cursă : Plăți : Numerar încasat",
];

/** Bolt Taxi weekly export column headers (production shape). */
const BOLT_TAXI_TEMPLATE_HEADERS = [
  "Driver",
  "Email",
  "Phone",
  "Driver identifier",
  "Gross earnings (total) LEI",
  "Net earnings LEI",
  "Collected cash LEI",
  "Gross earnings (in-app)",
  "Rider tips",
  "Commission fees",
];

export type ImportTemplatePlatform =
  | "uber"
  | "bolt_taxi"
  | "glovo"
  | "bolt_courier"
  | "wolt_courier";

export type ImportTemplateConfig = {
  id: ImportTemplatePlatform;
  label: string;
  category: string;
  filenameSlug: string;
  featured?: boolean;
};

export const IMPORT_TEMPLATE_PLATFORMS: ImportTemplateConfig[] = [
  { id: "glovo", label: "Glovo", category: "Courier", filenameSlug: "glovo-courier", featured: true },
  { id: "bolt_courier", label: "Bolt", category: "Courier", filenameSlug: "bolt-courier", featured: true },
  { id: "uber", label: "Uber", category: "Taxi", filenameSlug: "uber-taxi", featured: true },
  { id: "bolt_taxi", label: "Bolt Taxi", category: "Taxi", filenameSlug: "bolt-taxi", featured: true },
  { id: "wolt_courier", label: "Wolt", category: "Courier", filenameSlug: "wolt-courier" },
];

export const FEATURED_IMPORT_TEMPLATES = IMPORT_TEMPLATE_PLATFORMS.filter((p) => p.featured);

function triggerCsvDownload(filename: string, headers: string[]): void {
  const csv = [headers.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPlatformImportTemplate(platformId: ImportTemplatePlatform): void {
  const config = IMPORT_TEMPLATE_PLATFORMS.find((p) => p.id === platformId);
  const slug = config?.filenameSlug ?? platformId;
  const headers =
    platformId === "uber"
      ? UBER_TAXI_TEMPLATE_HEADERS
      : platformId === "bolt_taxi"
        ? BOLT_TAXI_TEMPLATE_HEADERS
        : TEMPLATE_HEADERS;
  triggerCsvDownload(`${slug}-import-template.csv`, headers);
}

/** @deprecated Use downloadPlatformImportTemplate */
export function downloadEarningsImportTemplate(): void {
  downloadPlatformImportTemplate("glovo");
}

export function scrollToRecentImports(): void {
  document.getElementById("recent-imports")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
