/** Earnings overview (/earnings) — payouts summary and reports, not import-only access. */
export const EARNINGS_OVERVIEW_PERMISSIONS = [
  "payouts.view",
  "payouts.view_all",
  "reports.view",
] as const;

/** Payout list and detail pages. */
export const PAYOUTS_VIEW_PERMISSIONS = ["payouts.view", "payouts.view_all"] as const;

/** Matches backend earnings router and useCanAccessFinance. */
export const FINANCE_VIEW_PERMISSIONS = EARNINGS_OVERVIEW_PERMISSIONS;

/** Earnings import page (history and/or upload). */
export const IMPORTS_VIEW_PERMISSIONS = ["imports.view", "imports.create"] as const;

/** Rentals list/detail pages (view or manage). */
export const RENTALS_VIEW_PERMISSIONS = ["rentals.view", "rentals.manage"] as const;

/** Roles page: view matrix with users.manage, edit with roles.manage. */
export const ROLES_VIEW_PERMISSIONS = ["roles.manage", "users.manage"] as const;
