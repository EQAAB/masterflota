import type { ActionMenuItemConfig } from "../../theme/ActionMenuDropdown";
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

type BuildPayoutActionMenuItemsArgs = {
  canCustomFees: boolean;
  canDebtActions: boolean;
  canReleaseHold: boolean;
  onOpenCustomFees?: () => void;
  onOpenDebtActions?: () => void;
  onOpenReleaseHold?: () => void;
  onExport: () => void;
};

export function buildPayoutActionMenuItems({
  canCustomFees,
  canDebtActions,
  canReleaseHold,
  onOpenCustomFees,
  onOpenDebtActions,
  onOpenReleaseHold,
  onExport,
}: BuildPayoutActionMenuItemsArgs): ActionMenuItemConfig[] {
  return [
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
      onSelect: onExport,
    },
  ];
}

/** Export is always available; the ⋮ trigger is always shown. */
export function payoutRowHasActionMenu(): boolean {
  return true;
}
