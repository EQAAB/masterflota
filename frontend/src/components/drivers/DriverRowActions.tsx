import { actionMenuTrigger, transitionDefault } from "../../theme/classNames";
import { DotsVerticalIcon } from "../theme/actionMenuIcons";
import { driverRowHasActionMenu } from "./buildDriverActionMenuItems";

type DriverRowActionsProps = {
  driverId: string;
  isActionMenuOpen: boolean;
  onActionMenuToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function DriverRowActions({
  isActionMenuOpen,
  onActionMenuToggle,
}: DriverRowActionsProps) {
  if (!driverRowHasActionMenu()) return null;

  return (
    <button
      type="button"
      aria-label="Driver actions"
      aria-haspopup="menu"
      aria-expanded={isActionMenuOpen}
      onClick={onActionMenuToggle}
      className={`${actionMenuTrigger} ${transitionDefault} ${isActionMenuOpen ? "ring-2 ring-brand/25" : ""}`}
    >
      <DotsVerticalIcon />
    </button>
  );
}
