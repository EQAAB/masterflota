import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RentalBooking } from "../../../api/rentals";
import { downloadRentalContract } from "../../../api/rentals";
import { ActionMenuDropdown } from "../../theme/ActionMenuDropdown";
import { BookingTableRow } from "./BookingTableRow";
import { BookingsEmptyState } from "./BookingsEmptyState";
import { buildBookingActionMenuItems } from "./buildBookingActionMenuItems";
import { useCanManageRentals } from "../../../lib/rentalsPermissions";
import type { BookingsDensity } from "./bookingsListUtils";

const MANAGE_BOOKING_MENU_IDS = new Set(["edit", "complete", "cancel"]);

type BookingsTableProps = {
  bookings: RentalBooking[];
  loading?: boolean;
  density: BookingsDensity;
};

export function BookingsTable({ bookings, loading, density }: BookingsTableProps) {
  const navigate = useNavigate();
  const canManage = useCanManageRentals();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
    setMenuAnchor(null);
  }, []);

  const handleActionMenuToggle = useCallback(
    (bookingId: string, el: HTMLElement) => {
      if (openMenuId === bookingId) {
        closeMenu();
        return;
      }
      setOpenMenuId(bookingId);
      setMenuAnchor(el);
    },
    [openMenuId, closeMenu],
  );

  const openBooking = bookings.find((b) => b.id === openMenuId);

  const menuItems = useMemo(() => {
    if (!openBooking) return [];
    const items = buildBookingActionMenuItems({
      booking: openBooking,
      onView: () => {
        closeMenu();
        navigate(`/rentals/bookings/${openBooking.id}`);
      },
      onEdit: () => {
        closeMenu();
        navigate(`/rentals/bookings/${openBooking.id}/edit`);
      },
      onInvoice: () => {
        closeMenu();
        void downloadRentalContract(openBooking.id);
      },
      onComplete: () => {
        closeMenu();
        navigate(`/rentals/bookings/${openBooking.id}`);
      },
      onCancel: () => {
        closeMenu();
        navigate(`/rentals/bookings/${openBooking.id}`);
      },
    });
    return canManage ? items : items.filter((item) => !MANAGE_BOOKING_MENU_IDS.has(item.id));
  }, [openBooking, closeMenu, navigate, canManage]);

  if (loading) {
    return (
      <div className="fm-rental-bookings__table-card p-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="fm-rental-bookings__skeleton h-16" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="fm-rental-bookings__table-card">
        <BookingsEmptyState />
      </div>
    );
  }

  return (
    <>
      <div className="fm-rental-bookings__table-card overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-slate-200/90 bg-slate-50/90 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3.5">Booking</th>
              <th className="px-4 py-3.5">Customer</th>
              <th className="px-4 py-3.5">Vehicle</th>
              <th className="px-4 py-3.5">Period</th>
              <th className="px-4 py-3.5">Total</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <BookingTableRow
                key={b.id}
                booking={b}
                density={density}
                onActionMenuToggle={handleActionMenuToggle}
                isMenuOpen={openMenuId === b.id}
              />
            ))}
          </tbody>
        </table>
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
