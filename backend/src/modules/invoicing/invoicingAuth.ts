import { requirePermission } from "../../middleware/auth";

export const requireInvoicingView = requirePermission("invoicing.view", "invoicing.manage");
export const requireInvoicingManage = requirePermission("invoicing.manage");
export const requireInvoicingAnaf = requirePermission("invoicing.anaf");
