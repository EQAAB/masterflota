import { requirePermission } from "../../middleware/auth";

/** Read access: rentals.view OR rentals.manage */
export const requireRentalsView = requirePermission("rentals.view", "rentals.manage");

/** Write access: rentals.manage only */
export const requireRentalsManage = requirePermission("rentals.manage");
