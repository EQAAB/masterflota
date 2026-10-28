import { chatJsonCompletion, isAiEnabled } from "./openaiClient";
import { OPS_DIGEST_SYSTEM } from "./prompts";

export type OpsDigestSeverity = "high" | "medium" | "low";

export type OpsDigestItem = {
  id: string;
  severity: OpsDigestSeverity;
  title: string;
  detail: string;
  link: string;
  count: number;
};

export type OpsDigestStatsInput = {
  pendingDocuments: number;
  expiredDocuments: number;
  pendingPayoutRows: number | null;
  pendingPayments: number | null;
  outstandingDebt: number | null;
  driversWithDebt: number | null;
  outstandingLoans: number | null;
  driversWithLoans: number | null;
  overdueRentals: number | null;
  periodFrom: string;
  periodTo: string;
};

export function buildOpsDigestItems(stats: OpsDigestStatsInput): OpsDigestItem[] {
  const items: OpsDigestItem[] = [];

  if (stats.expiredDocuments > 0) {
    items.push({
      id: "expired-documents",
      severity: "high",
      title: "Expired driver documents",
      detail: `${stats.expiredDocuments} document(s) past expiry need renewal.`,
      link: "/drivers",
      count: stats.expiredDocuments,
    });
  }

  if (stats.overdueRentals != null && stats.overdueRentals > 0) {
    items.push({
      id: "overdue-rentals",
      severity: "high",
      title: "Overdue rental bookings",
      detail: `${stats.overdueRentals} active booking(s) are past their end date.`,
      link: "/rentals/bookings",
      count: stats.overdueRentals,
    });
  }

  if (stats.pendingPayoutRows != null && stats.pendingPayoutRows > 0) {
    const amount =
      stats.pendingPayments != null
        ? ` (~${stats.pendingPayments.toFixed(2)} RON)`
        : "";
    items.push({
      id: "pending-payouts",
      severity: "high",
      title: "Unpaid payouts this period",
      detail: `${stats.pendingPayoutRows} payout row(s) pending${amount}.`,
      link: "/earnings/payouts",
      count: stats.pendingPayoutRows,
    });
  }

  if (stats.outstandingDebt != null && stats.outstandingDebt > 0.02) {
    items.push({
      id: "outstanding-debt",
      severity: "medium",
      title: "Outstanding platform debt",
      detail: `${(stats.driversWithDebt ?? 0)} driver(s) with ${stats.outstandingDebt.toFixed(2)} RON remaining debt.`,
      link: "/earnings/payouts",
      count: stats.driversWithDebt ?? 0,
    });
  }

  if (stats.outstandingLoans != null && stats.outstandingLoans > 0.02) {
    items.push({
      id: "outstanding-loans",
      severity: "medium",
      title: "Active driver loans",
      detail: `${(stats.driversWithLoans ?? 0)} driver(s) with ${stats.outstandingLoans.toFixed(2)} RON outstanding.`,
      link: "/earnings/loans",
      count: stats.driversWithLoans ?? 0,
    });
  }

  if (stats.pendingDocuments > 0) {
    items.push({
      id: "pending-documents",
      severity: "medium",
      title: "Documents awaiting verification",
      detail: `${stats.pendingDocuments} document(s) not yet verified.`,
      link: "/drivers",
      count: stats.pendingDocuments,
    });
  }

  const severityRank: Record<OpsDigestSeverity, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  items.sort((a, b) => {
    const s = severityRank[a.severity] - severityRank[b.severity];
    if (s !== 0) return s;
    return b.count - a.count;
  });

  return items;
}

export async function narrateOpsDigest(
  items: OpsDigestItem[],
  periodFrom: string,
  periodTo: string,
): Promise<string | null> {
  if (!isAiEnabled() || items.length === 0) return null;

  const raw = await chatJsonCompletion({
    system: OPS_DIGEST_SYSTEM,
    user: JSON.stringify({ periodFrom, periodTo, items }),
    maxTokens: 400,
  });

  try {
    const parsed = JSON.parse(raw) as { narrative?: unknown };
    if (typeof parsed.narrative === "string" && parsed.narrative.trim()) {
      return parsed.narrative.trim();
    }
  } catch {
    // fall through
  }
  return null;
}
