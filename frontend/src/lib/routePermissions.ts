/** Matches backend earnings router and useCanAccessFinance. */
export const FINANCE_VIEW_PERMISSIONS = [
  "payouts.view",
  "imports.view",
  "imports.create",
  "reports.view",
] as const;

/** Earnings import page (history and/or upload). */
export const IMPORTS_VIEW_PERMISSIONS = ["imports.view", "imports.create"] as const;

/** Rentals list/detail pages (view or manage). */
export const RENTALS_VIEW_PERMISSIONS = ["rentals.view", "rentals.manage"] as const;

/** Roles page: view matrix with users.manage, edit with roles.manage. */
export const ROLES_VIEW_PERMISSIONS = ["roles.manage", "users.manage"] as const;
