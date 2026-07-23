import { requirePermission } from "../../middleware/auth";

/** Import history and org settings read. */
export const requireImportsView = requirePermission("imports.view", "imports.create");

/** Payout list, detail, debt read endpoints. */
export const requirePayoutsView = requirePermission("payouts.view", "payouts.view_all");

/** Earnings overview (summary KPIs). */
export const requireEarningsOverview = requirePermission(
  "payouts.view",
  "payouts.view_all",
  "reports.view",
);

/** Reports and payout integrity. */
export const requireReportsView = requirePermission("reports.view");

/** Subcontractor settlement endpoints under /api/earnings. */
export const requireSubcontractorSettle = requirePermission("subcontractors.settle");
