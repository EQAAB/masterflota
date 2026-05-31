import type { PayoutListItem } from "../../../api/earnings";
import { actionMenuTrigger, transitionDefault } from "../../../theme/classNames";
import { DotsVerticalIcon } from "../../theme/actionMenuIcons";
import { payoutRowHasActionMenu } from "./buildPayoutActionMenuItems";

type PayoutRowActionsProps = {
  row: PayoutListItem;
  isPending: boolean;
  isPaying: boolean;
  isPayingRow: boolean;
  isSelected: boolean;
  isActionMenuOpen: boolean;
  onActionMenuToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onToggleSelection: () => void;
  onPayNow: () => void;
  align?: "left" | "right";
};

export function PayoutRowActions({
  row,
  isPending,
  isPaying,
  isPayingRow,
  isSelected,
  isActionMenuOpen,
  onActionMenuToggle,
  onToggleSelection,
  onPayNow,
  align = "left",
}: PayoutRowActionsProps) {
  const showMenu = payoutRowHasActionMenu();

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${align === "right" ? "justify-end" : ""}`}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-border text-brand focus:ring-brand/30"
        checked={isSelected}
        onChange={onToggleSelection}
        disabled={!isPending || isPaying}
        aria-label={`Select payout for ${row.first_name}`}
      />
      {isPending && (
        <button type="button" disabled={isPaying} onClick={onPayNow} className="fm-payout-pay-btn">
          {isPayingRow ? "Paying…" : "Pay now"}
        </button>
      )}
      {showMenu && (
        <button
          type="button"
          disabled={isPaying}
          aria-label={`Actions for ${row.first_name} ${row.last_name}`}
          aria-expanded={isActionMenuOpen}
          aria-haspopup="menu"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onActionMenuToggle}
          className={`${actionMenuTrigger} ${transitionDefault} disabled:opacity-50 ${
            isActionMenuOpen ? "ring-2 ring-brand/25" : ""
          }`}
        >
          <DotsVerticalIcon />
        </button>
      )}
    </div>
  );
}
