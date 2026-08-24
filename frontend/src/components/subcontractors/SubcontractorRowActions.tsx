import { useTranslation } from "react-i18next";
import { actionMenuTrigger, transitionDefault } from "../../theme/classNames";
import { DotsVerticalIcon } from "../theme/actionMenuIcons";

type SubcontractorRowActionsProps = {
  isActionMenuOpen: boolean;
  onActionMenuToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function SubcontractorRowActions({ isActionMenuOpen, onActionMenuToggle }: SubcontractorRowActionsProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      aria-label={t("pages.subcontractorsList.rowActionsAriaLabel")}
      aria-haspopup="menu"
      aria-expanded={isActionMenuOpen}
      onClick={onActionMenuToggle}
      className={`${actionMenuTrigger} ${transitionDefault} ${isActionMenuOpen ? "ring-2 ring-brand/25" : ""}`}
    >
      <DotsVerticalIcon />
    </button>
  );
}
