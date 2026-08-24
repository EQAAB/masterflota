import i18n from "../../../i18n";
import type { RentalPaymentListItem } from "../../../api/rentals";
import type { ActionMenuItemConfig } from "../../theme/ActionMenuDropdown";

function MenuIconWrap({ children, tone }: { children: React.ReactNode; tone: "brand" | "muted" | "danger" }) {
  const toneClass =
    tone === "brand"
      ? "bg-brand/10 text-brand"
      : tone === "danger"
        ? "bg-danger/10 text-danger"
        : "bg-ink/5 text-ink-muted";
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
      {children}
    </span>
  );
}

type BuildPaymentActionMenuItemsArgs = {
  row: RentalPaymentListItem;
  onViewInvoice: () => void;
  onMarkPaid: () => void;
  onRefund: () => void;
  onEdit: () => void;
};

export function buildPaymentActionMenuItems({
  row,
  onViewInvoice,
  onMarkPaid,
  onRefund,
  onEdit,
}: BuildPaymentActionMenuItemsArgs): ActionMenuItemConfig[] {
  return [
    {
      id: "invoice",
      label: i18n.t("pages.payments.viewInvoiceAction"),
      icon: (
        <MenuIconWrap tone="brand">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onViewInvoice,
    },
    {
      id: "receipt",
      label: i18n.t("pages.payments.downloadReceiptAction"),
      icon: (
        <MenuIconWrap tone="muted">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onViewInvoice,
      disabled: false,
    },
    {
      id: "edit",
      label: i18n.t("pages.payments.editPayment"),
      icon: (
        <MenuIconWrap tone="muted">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onEdit,
    },
    {
      id: "paid",
      label: i18n.t("pages.payments.markPaidAction"),
      icon: (
        <MenuIconWrap tone="brand">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onMarkPaid,
      disabled: row.status === "paid",
    },
    {
      id: "refund",
      label: i18n.t("pages.payments.refundAction"),
      icon: (
        <MenuIconWrap tone="danger">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onRefund,
      disabled: row.status === "refunded" || row.payment_type === "deposit_refund",
    },
  ];
}
