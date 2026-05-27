import type { SubcontractorSettlementRow } from "../../../api/earnings";
import { transitionDefault } from "../../../theme/classNames";
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
    <button
      type="button"
      disabled={disabled}
      aria-label={`Actions for ${row.legal_name}`}
      aria-expanded={isActionMenuOpen}
      aria-haspopup="menu"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onActionMenuToggle(e);
      }}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-white text-slate-500 shadow-sm ${transitionDefault} hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 hover:shadow disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand/20 ${
        isActionMenuOpen ? "ring-2 ring-brand/25" : ""
      }`}
    >
      <DotsVerticalIcon />
    </button>
  );
}
