import axios from "axios";
import i18n from "../../../i18n";

export function reportsErrMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const m = e.response?.data as { message?: string } | undefined;
    if (typeof e.response?.data === "string" && e.response.data.length < 200) return e.response.data;
    if (m?.message) return m.message;
    return e.message;
  }
  return e instanceof Error ? e.message : i18n.t("pages.earningsReports.exportFailed");
}

export const REPORTS_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type DebtAgingBucketKey = "0_30" | "31_60" | "61_90" | "91_plus";

export const DEBT_AGING_BUCKETS: DebtAgingBucketKey[] = ["0_30", "31_60", "61_90", "91_plus"];

export function debtBucketLabel(key: DebtAgingBucketKey): string {
  switch (key) {
    case "0_30":
      return i18n.t("pages.earningsReports.debtBucket0_30");
    case "31_60":
      return i18n.t("pages.earningsReports.debtBucket31_60");
    case "61_90":
      return i18n.t("pages.earningsReports.debtBucket61_90");
    case "91_plus":
      return i18n.t("pages.earningsReports.debtBucket91_plus");
  }
}

export function debtBucketTint(key: DebtAgingBucketKey): {
  card: string;
  icon: string;
} {
  switch (key) {
    case "0_30":
      return { card: "bg-emerald-50 border-emerald-100", icon: "bg-emerald-100 text-emerald-700" };
    case "31_60":
      return { card: "bg-purple-50 border-purple-100", icon: "bg-purple-100 text-purple-700" };
    case "61_90":
      return { card: "bg-orange-50 border-orange-100", icon: "bg-orange-100 text-orange-700" };
    case "91_plus":
      return { card: "bg-red-50 border-red-100", icon: "bg-red-100 text-red-700" };
  }
}

export function reportStatusBadgeClass(status: string): string {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-800";
    case "approved":
      return "bg-brand-mint text-brand";
    case "processing":
      return "bg-violet-100 text-violet-800";
    case "failed":
      return "bg-rose-100 text-rose-800";
    case "hold":
      return "bg-amber-100 text-amber-900";
    case "debt":
      return "bg-red-100 text-red-800";
    case "pending":
    default:
      return "bg-amber-100 text-amber-800";
  }
}

export function reportStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return i18n.t("pages.earningsReports.statusPending");
    case "processing":
      return i18n.t("pages.earningsReports.statusProcessing");
    case "approved":
      return i18n.t("pages.earningsReports.statusApproved");
    case "paid":
      return i18n.t("status.paid");
    case "failed":
      return i18n.t("pages.earningsReports.statusFailed");
    case "hold":
      return i18n.t("pages.earningsReports.statusHold");
    case "debt":
      return i18n.t("status.debt");
    default:
      return status;
  }
}

export function formatAvgCommissionRate(rate: number): string {
  if (!(rate > 0)) return "—";
  return `${(rate * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
}
