import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { RentalPricing } from "../../../api/rentals";
import i18n from "../../../i18n";
import { createRentalPricing, updateRentalPricing } from "../../../api/rentals";
import { ActionMenuDropdown } from "../../theme/ActionMenuDropdown";
import { buildPricingActionMenuItems } from "./buildPricingActionMenuItems";
import { PricingEmptyState } from "./PricingEmptyState";
import { PricingMobileCard } from "./PricingMobileCard";
import { PricingTableRow } from "./PricingTableRow";

type PricingTableProps = {
  rows: RentalPricing[];
  loading?: boolean;
  canManage?: boolean;
  onAdd: () => void;
  onEdit: (row: RentalPricing) => void;
};

export function PricingTable({ rows, loading, canManage = false, onAdd, onEdit }: PricingTableProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
    setMenuAnchor(null);
  }, []);

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

  const handleDuplicate = useCallback(
    async (row: RentalPricing) => {
      closeMenu();
      await createRentalPricing({
        vehicleId: row.vehicle_id,
        vehicleType: row.vehicle_type,
        dailyRate: Number(row.daily_rate),
        weeklyRate: Number(row.weekly_rate),
        monthlyRate: Number(row.monthly_rate),
        depositDefault: Number(row.deposit_default),
        effectiveFrom: row.effective_from ?? null,
        effectiveTo: row.effective_to ?? null,
        isActive: true,
      });
      void queryClient.invalidateQueries({ queryKey: ["rentals", "pricing"] });
      void queryClient.invalidateQueries({ queryKey: ["rentals", "pricing", "summary"] });
      void queryClient.invalidateQueries({ queryKey: ["rentals", "pricing", "insights"] });
    },
    [closeMenu, queryClient],
  );

  const handleArchive = useCallback(
    async (row: RentalPricing) => {
      if (!window.confirm(i18n.t("pages.pricing.archiveConfirm"))) return;
      closeMenu();
      await updateRentalPricing(row.id, { isActive: false });
      void queryClient.invalidateQueries({ queryKey: ["rentals", "pricing"] });
      void queryClient.invalidateQueries({ queryKey: ["rentals", "pricing", "summary"] });
      void queryClient.invalidateQueries({ queryKey: ["rentals", "pricing", "insights"] });
    },
    [closeMenu, queryClient],
  );

  const menuItems = useMemo(() => {
    if (!openRow) return [];
    return buildPricingActionMenuItems({
      row: openRow,
      onEdit: () => {
        closeMenu();
        onEdit(openRow);
      },
      onDuplicate: () => {
        void handleDuplicate(openRow);
      },
      onArchive: () => {
        void handleArchive(openRow);
      },
    });
  }, [openRow, closeMenu, onEdit, handleDuplicate, handleArchive]);

  if (loading) {
    return (
      <div className="fm-rental-pricing__table-card p-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="fm-rental-pricing__skeleton h-20" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="fm-rental-pricing__table-card">
        <PricingEmptyState canManage={canManage} onAdd={onAdd} />
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:block fm-rental-pricing__table-card overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-slate-200/90 bg-slate-50/90 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3.5">{t("pages.pricing.colVehicle")}</th>
              <th className="px-4 py-3.5">{t("pages.pricing.colDailyRate")}</th>
              <th className="px-4 py-3.5">{t("pages.pricing.colWeeklyRate")}</th>
              <th className="px-4 py-3.5">{t("pages.pricing.colMonthlyRate")}</th>
              <th className="px-4 py-3.5">{t("pages.pricing.colDeposit")}</th>
              <th className="px-4 py-3.5">{t("pages.pricing.colAvailability")}</th>
              <th className="px-4 py-3.5">{t("pages.pricing.colPricingStatus")}</th>
              {canManage ? <th className="px-4 py-3.5 text-right">{t("pages.pricing.colActions")}</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <PricingTableRow
                key={row.id}
                row={row}
                expanded={expandedId === row.id}
                canManage={canManage}
                onToggleExpand={() =>
                  setExpandedId((id) => (id === row.id ? null : row.id))
                }
                onActionMenuToggle={handleActionMenuToggle}
                isMenuOpen={openMenuId === row.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <PricingMobileCard
            key={row.id}
            row={row}
            canManage={canManage}
            onExpand={() => setExpandedId((id) => (id === row.id ? null : row.id))}
            onActionMenuToggle={handleActionMenuToggle}
            isMenuOpen={openMenuId === row.id}
          />
        ))}
      </div>

      {canManage ? (
        <ActionMenuDropdown
          open={!!openMenuId && !!menuAnchor}
          anchorEl={menuAnchor}
          items={menuItems}
          align="right"
          onClose={closeMenu}
        />
      ) : null}
    </>
  );
}
