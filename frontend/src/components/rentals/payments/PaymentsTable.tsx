import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RentalPaymentListItem } from "../../../api/rentals";
import { downloadRentalContract, updateRentalPayment } from "../../../api/rentals";
import { ActionMenuDropdown } from "../../theme/ActionMenuDropdown";
import { buildPaymentActionMenuItems } from "./buildPaymentActionMenuItems";
import { PaymentMobileCard } from "./PaymentMobileCard";
import { PaymentTableRow } from "./PaymentTableRow";
import { PaymentsEmptyState } from "./PaymentsEmptyState";

type PaymentsTableProps = {
  rows: RentalPaymentListItem[];
  loading?: boolean;
  canManage?: boolean;
  onRecord: () => void;
  onEdit: (row: RentalPaymentListItem) => void;
};

const MANAGE_PAYMENT_MENU_IDS = new Set(["edit", "paid", "refund"]);

export function PaymentsTable({ rows, loading, canManage = false, onRecord, onEdit }: PaymentsTableProps) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
    setMenuAnchor(null);
  }, []);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["rentals", "payments"] });
  }, [queryClient]);

  const handleActionMenuToggle = useCallback(
    (id: string, el: HTMLElement) => {
      if (openMenuId === id) {
        closeMenu();
        return;
      }
      setOpenMenuId(id);
      setMenuAnchor(el);
    },
    [openMenuId, closeMenu],
  );

  const openRow = rows.find((r) => r.id === openMenuId);

  const handleMarkPaid = useCallback(
    async (row: RentalPaymentListItem) => {
      closeMenu();
      await updateRentalPayment(row.id, { status: "paid" });
      invalidate();
    },
    [closeMenu, invalidate],
  );

  const handleRefund = useCallback(
    async (row: RentalPaymentListItem) => {
      if (!window.confirm("Mark this payment as refunded?")) return;
      closeMenu();
      await updateRentalPayment(row.id, { status: "refunded" });
      invalidate();
    },
    [closeMenu, invalidate],
  );

  const menuItems = useMemo(() => {
    if (!openRow) return [];
    const items = buildPaymentActionMenuItems({
      row: openRow,
      onViewInvoice: () => {
        closeMenu();
        void downloadRentalContract(openRow.booking_id);
      },
      onMarkPaid: () => {
        void handleMarkPaid(openRow);
      },
      onRefund: () => {
        void handleRefund(openRow);
      },
      onEdit: () => {
        closeMenu();
        onEdit(openRow);
      },
    });
    return canManage ? items : items.filter((item) => !MANAGE_PAYMENT_MENU_IDS.has(item.id));
  }, [openRow, closeMenu, onEdit, handleMarkPaid, handleRefund, canManage]);

  if (loading) {
    return (
      <div className="fm-rental-payments__table-card p-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="fm-rental-payments__skeleton h-20" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="fm-rental-payments__table-card">
        <PaymentsEmptyState canManage={canManage} onRecord={onRecord} />
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:block fm-rental-payments__table-card overflow-x-auto">
        <table className="w-full min-w-[1200px] text-sm">
          <thead>
            <tr className="border-b border-slate-200/90 bg-slate-50/90 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3.5">Booking</th>
              <th className="px-4 py-3.5">Customer</th>
              <th className="px-4 py-3.5">Vehicle</th>
              <th className="px-4 py-3.5">Payment type</th>
              <th className="px-4 py-3.5">Amount</th>
              <th className="px-4 py-3.5">Method</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <PaymentTableRow
                key={row.id}
                row={row}
                expanded={expandedId === row.id}
                onToggleExpand={() => setExpandedId((id) => (id === row.id ? null : row.id))}
                onActionMenuToggle={handleActionMenuToggle}
                isMenuOpen={openMenuId === row.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <PaymentMobileCard
            key={row.id}
            row={row}
            onExpand={() => setExpandedId((id) => (id === row.id ? null : row.id))}
            onActionMenuToggle={handleActionMenuToggle}
            isMenuOpen={openMenuId === row.id}
          />
        ))}
      </div>

      <ActionMenuDropdown
        open={!!openMenuId && !!menuAnchor}
        anchorEl={menuAnchor}
        items={menuItems}
        align="right"
        onClose={closeMenu}
      />
    </>
  );
}
