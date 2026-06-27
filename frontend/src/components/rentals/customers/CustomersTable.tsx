import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { RentalCustomer } from "../../../api/rentals";
import { deleteRentalCustomer } from "../../../api/rentals";
import { ActionMenuDropdown } from "../../theme/ActionMenuDropdown";
import { CustomerDetailDrawer } from "./CustomerDetailDrawer";
import { CustomerMobileCard } from "./CustomerMobileCard";
import { CustomerTableRow } from "./CustomerTableRow";
import { CustomersEmptyState } from "./CustomersEmptyState";
import { useCanManageRentals } from "../../../lib/rentalsPermissions";
import { buildCustomerActionMenuItems } from "./buildCustomerActionMenuItems";

const MANAGE_CUSTOMER_MENU_IDS = new Set(["edit", "archive"]);

type CustomersTableProps = {
  customers: RentalCustomer[];
  loading?: boolean;
};

export function CustomersTable({ customers, loading }: CustomersTableProps) {
  const navigate = useNavigate();
  const canManage = useCanManageRentals();
  const queryClient = useQueryClient();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [drawerCustomer, setDrawerCustomer] = useState<RentalCustomer | null>(null);

  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
    setMenuAnchor(null);
  }, []);

  const handleActionMenuToggle = useCallback(
    (customerId: string, el: HTMLElement) => {
      if (openMenuId === customerId) {
        closeMenu();
        return;
      }
      setOpenMenuId(customerId);
      setMenuAnchor(el);
    },
    [openMenuId, closeMenu],
  );

  const openCustomer = customers.find((c) => c.id === openMenuId);

  const handleArchive = useCallback(
    async (c: RentalCustomer) => {
      if (!window.confirm(`Archive ${c.legal_name}? They will be hidden from the active list.`)) return;
      closeMenu();
      await deleteRentalCustomer(c.id);
      void queryClient.invalidateQueries({ queryKey: ["rentals", "customers"] });
      void queryClient.invalidateQueries({ queryKey: ["rentals", "customers", "summary"] });
      if (drawerCustomer?.id === c.id) setDrawerCustomer(null);
    },
    [closeMenu, queryClient, drawerCustomer?.id],
  );

  const menuItems = useMemo(() => {
    if (!openCustomer) return [];
    const items = buildCustomerActionMenuItems({
      customer: openCustomer,
      onViewProfile: () => {
        closeMenu();
        setDrawerCustomer(openCustomer);
      },
      onEdit: () => {
        closeMenu();
        navigate(`/rentals/customers/${openCustomer.id}/edit`);
      },
      onViewBookings: () => {
        closeMenu();
        navigate(`/rentals/bookings?customerId=${openCustomer.id}`);
      },
      onArchive: () => {
        void handleArchive(openCustomer);
      },
    });
    return canManage ? items : items.filter((item) => !MANAGE_CUSTOMER_MENU_IDS.has(item.id));
  }, [openCustomer, closeMenu, navigate, handleArchive, canManage]);

  if (loading) {
    return (
      <div className="fm-rental-customers__table-card p-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="fm-rental-customers__skeleton h-16" />
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="fm-rental-customers__table-card">
        <CustomersEmptyState />
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:block fm-rental-customers__table-card overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-slate-200/90 bg-slate-50/90 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3.5">Customer</th>
              <th className="px-4 py-3.5">Type</th>
              <th className="px-4 py-3.5">Contact</th>
              <th className="px-4 py-3.5">Vehicle</th>
              <th className="px-4 py-3.5">Active bookings</th>
              <th className="px-4 py-3.5">Total rentals</th>
              <th className="px-4 py-3.5">Revenue</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <CustomerTableRow
                key={c.id}
                customer={c}
                onRowClick={() => setDrawerCustomer(c)}
                onActionMenuToggle={handleActionMenuToggle}
                isMenuOpen={openMenuId === c.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {customers.map((c) => (
          <CustomerMobileCard
            key={c.id}
            customer={c}
            onOpen={() => setDrawerCustomer(c)}
            onActionMenuToggle={handleActionMenuToggle}
            isMenuOpen={openMenuId === c.id}
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

      <CustomerDetailDrawer customer={drawerCustomer} onClose={() => setDrawerCustomer(null)} />
    </>
  );
}
