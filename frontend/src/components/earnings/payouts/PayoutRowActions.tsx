import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { PayoutListItem } from "../../../api/earnings";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";

type PayoutRowActionsProps = {
  row: PayoutListItem;
  isPending: boolean;
  isPaying: boolean;
  isPayingRow: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  canCustomFees: boolean;
  canDebtActions: boolean;
  canReleaseHold: boolean;
  onToggleSelection: () => void;
  onPayNow: () => void;
  onOpenCustomFees?: () => void;
  onOpenDebtActions?: () => void;
  onOpenReleaseHold?: () => void;
  onToggleExpand: () => void;
  align?: "left" | "right";
};

export function PayoutRowActions({
  row,
  isPending,
  isPaying,
  isPayingRow,
  isSelected,
  isExpanded,
  canCustomFees,
  canDebtActions,
  canReleaseHold,
  onToggleSelection,
  onPayNow,
  onOpenCustomFees,
  onOpenDebtActions,
  onOpenReleaseHold,
  onToggleExpand,
  align = "left",
}: PayoutRowActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const menuItemClass =
    "block w-full text-left rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50";

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${align === "right" ? "justify-end" : ""}`}
      ref={menuRef}
    >
      <input
        type="checkbox"
        className="rounded border-border"
        checked={isSelected}
        onChange={onToggleSelection}
        disabled={!isPending || isPaying}
        aria-label={`Select payout for ${row.first_name}`}
      />
      {isPending && (
        <button type="button" disabled={isPaying} onClick={onPayNow} className={btnPrimary}>
          {isPayingRow ? "Paying…" : "Pay now"}
        </button>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={isPaying}
          onClick={() => setMenuOpen((o) => !o)}
          className={btnSecondary}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          More
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 min-w-[11rem] rounded-card border border-border bg-white py-1 shadow-soft-lg"
          >
            {canCustomFees && (
              <button
                type="button"
                role="menuitem"
                disabled={isPaying}
                onClick={() => {
                  setMenuOpen(false);
                  onOpenCustomFees?.();
                }}
                className={`${menuItemClass} text-ink hover:bg-surface mx-1`}
              >
                Custom fees
              </button>
            )}
            {canDebtActions && (
              <button
                type="button"
                role="menuitem"
                disabled={isPaying}
                onClick={() => {
                  setMenuOpen(false);
                  onOpenDebtActions?.();
                }}
                className={`${menuItemClass} text-danger hover:bg-danger/5 mx-1`}
              >
                Adjust debt
              </button>
            )}
            {canReleaseHold && (
              <button
                type="button"
                role="menuitem"
                disabled={isPaying}
                onClick={() => {
                  setMenuOpen(false);
                  onOpenReleaseHold?.();
                }}
                className={`${menuItemClass} text-ink-muted hover:bg-surface mx-1`}
              >
                Release hold
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onToggleExpand();
              }}
              className={`${menuItemClass} text-ink hover:bg-surface mx-1`}
            >
              {isExpanded ? "Hide details" : "Details"}
            </button>
            <Link
              to={`/earnings/reports?driverId=${encodeURIComponent(row.driver_id)}`}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className={`${menuItemClass} text-ink hover:bg-surface mx-1 no-underline`}
            >
              Export
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
