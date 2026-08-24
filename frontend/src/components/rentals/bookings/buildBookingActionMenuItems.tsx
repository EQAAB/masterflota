import i18n from "../../../i18n";
import type { RentalBooking } from "../../../api/rentals";
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

type BuildBookingActionMenuItemsArgs = {
  booking: RentalBooking;
  onView: () => void;
  onEdit: () => void;
  onInvoice: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onRenew?: () => void;
};

export function buildBookingActionMenuItems({
  booking,
  onView,
  onEdit,
  onInvoice,
  onComplete,
  onCancel,
  onRenew,
}: BuildBookingActionMenuItemsArgs): ActionMenuItemConfig[] {
  const canEdit = booking.status === "draft";
  const canInvoice = booking.status !== "draft" && booking.status !== "cancelled";
  const canComplete = booking.status === "active";
  const canCancel = booking.status === "draft" || booking.status === "confirmed";
  const canRenew =
    booking.rental_type === "weekly" && booking.status === "active" && !!onRenew;

  return [
    {
      id: "view",
      label: i18n.t("pages.bookings.viewBookingAction"),
      icon: (
        <MenuIconWrap tone="brand">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onView,
    },
    {
      id: "edit",
      label: i18n.t("pages.bookings.editAction"),
      icon: (
        <MenuIconWrap tone="muted">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onEdit,
      disabled: !canEdit,
    },
    {
      id: "invoice",
      label: i18n.t("pages.bookings.invoiceAction"),
      icon: (
        <MenuIconWrap tone="muted">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onInvoice,
      disabled: !canInvoice,
    },
    {
      id: "complete",
      label: i18n.t("pages.bookings.completeAction"),
      icon: (
        <MenuIconWrap tone="brand">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onComplete,
      disabled: !canComplete,
    },
    {
      id: "renew",
      label: i18n.t("pages.bookings.renew1WeekAction"),
      icon: (
        <MenuIconWrap tone="brand">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: () => onRenew?.(),
      disabled: !canRenew,
    },
    {
      id: "cancel",
      label: i18n.t("pages.bookings.cancelBookingAction"),
      icon: (
        <MenuIconWrap tone="danger">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onCancel,
      disabled: !canCancel,
    },
  ];
}
