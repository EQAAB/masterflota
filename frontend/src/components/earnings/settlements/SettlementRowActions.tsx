import type { SubcontractorSettlementRow } from "../../../api/earnings";
import { actionMenuTrigger, transitionDefault } from "../../../theme/classNames";
import { DotsVerticalIcon } from "../../theme/actionMenuIcons";

type SettlementRowActionsProps = {
  row: SubcontractorSettlementRow;
  isActionMenuOpen: boolean;
  disabled?: boolean;
  onActionMenuToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function SettlementRowActions({
  row,
  isActionMenuOpen,
  disabled = false,
  onActionMenuToggle,
}: SettlementRowActionsProps) {
  return (
    <div
      className="flex items-center justify-center"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={`Actions for ${row.legal_name}`}
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
    </div>
  );
}
