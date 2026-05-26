import { actionMenuTrigger, transitionDefault } from "../../theme/classNames";
import { DotsVerticalIcon } from "../theme/actionMenuIcons";

type VehicleRowActionsProps = {
  isActionMenuOpen: boolean;
  onActionMenuToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function VehicleRowActions({ isActionMenuOpen, onActionMenuToggle }: VehicleRowActionsProps) {
  return (
    <button
      type="button"
      aria-label="Vehicle actions"
      aria-haspopup="menu"
      aria-expanded={isActionMenuOpen}
      onClick={onActionMenuToggle}
      className={`${actionMenuTrigger} ${transitionDefault} ${isActionMenuOpen ? "ring-2 ring-brand/25" : ""}`}
    >
      <DotsVerticalIcon />
    </button>
  );
}
