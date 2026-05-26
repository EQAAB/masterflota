import { useNavigate } from "react-router-dom";
import type { PayoutListItem } from "../../../api/earnings";
import { btnPrimary } from "../../../theme/classNames";
import { ActionMenu } from "../../theme/ActionMenu";
import {
  ActionMenuIconDebt,
  ActionMenuIconExport,
  ActionMenuIconFees,
  ActionMenuIconHold,
  AdjustDebtIcon,
  CustomFeesIcon,
  ExportIcon,
  ReleaseHoldIcon,
} from "../../theme/actionMenuIcons";

type PayoutRowActionsProps = {
  row: PayoutListItem;
  isPending: boolean;
  isPaying: boolean;
  isPayingRow: boolean;
  isSelected: boolean;
  canCustomFees: boolean;
  canDebtActions: boolean;
  canReleaseHold: boolean;
  onToggleSelection: () => void;
  onPayNow: () => void;
  onOpenCustomFees?: () => void;
  onOpenDebtActions?: () => void;
  onOpenReleaseHold?: () => void;
  align?: "left" | "right";
};

export function PayoutRowActions({
  row,
  isPending,
  isPaying,
  isPayingRow,
  isSelected,
  canCustomFees,
  canDebtActions,
  canReleaseHold,
  onToggleSelection,
  onPayNow,
  onOpenCustomFees,
  onOpenDebtActions,
  onOpenReleaseHold,
  align = "left",
}: PayoutRowActionsProps) {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: "adjust-debt",
      label: "Adjust debt",
      icon: (
        <ActionMenuIconDebt>
          <AdjustDebtIcon />
        </ActionMenuIconDebt>
      ),
      onSelect: () => onOpenDebtActions?.(),
      hidden: !canDebtActions,
    },
    {
      id: "custom-fees",
      label: "Custom fees",
      icon: (
        <ActionMenuIconFees>
          <CustomFeesIcon />
        </ActionMenuIconFees>
      ),
      onSelect: () => onOpenCustomFees?.(),
      hidden: !canCustomFees,
    },
    {
      id: "release-hold",
      label: "Release hold",
      icon: (
        <ActionMenuIconHold>
          <ReleaseHoldIcon />
        </ActionMenuIconHold>
      ),
      onSelect: () => onOpenReleaseHold?.(),
      hidden: !canReleaseHold,
    },
    {
      id: "export",
      label: "Export",
      icon: (
        <ActionMenuIconExport>
          <ExportIcon />
        </ActionMenuIconExport>
      ),
      onSelect: () => {
        navigate(`/earnings/reports?driverId=${encodeURIComponent(row.driver_id)}`);
      },
    },
  ];

  const showMenu = menuItems.some((i) => !i.hidden);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${align === "right" ? "justify-end" : ""}`}>
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
      {showMenu && (
        <ActionMenu
          items={menuItems}
          align={align}
          disabled={isPaying}
          aria-label={`Actions for ${row.first_name} ${row.last_name}`}
        />
      )}
    </div>
  );
}
