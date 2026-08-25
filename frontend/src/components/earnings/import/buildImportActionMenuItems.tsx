import type { ReactNode } from "react";
import i18n from "../../../i18n";
import type { ActionMenuItemConfig } from "../../theme/ActionMenuDropdown";

function MenuIconWrap({ children, tone }: { children: ReactNode; tone: "brand" | "muted" | "danger" }) {
  const toneClass =
    tone === "brand"
      ? "bg-brand/10 text-brand"
      : tone === "danger"
        ? "bg-danger/10 text-danger"
        : "bg-ink/5 text-ink-muted";
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
      {children}
    </span>
  );
}

function RevertIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

type BuildImportActionMenuItemsArgs = {
  canDelete: boolean;
  canRevert: boolean;
  onDelete: () => void;
  onRevert: () => void;
};

export function buildImportActionMenuItems({
  canDelete,
  canRevert,
  onDelete,
  onRevert,
}: BuildImportActionMenuItemsArgs): ActionMenuItemConfig[] {
  const items: ActionMenuItemConfig[] = [];

  if (canRevert) {
    items.push({
      id: "revert-import",
      label: i18n.t("pages.earningsImport.revertImportAction"),
      icon: (
        <MenuIconWrap tone="brand">
          <RevertIcon />
        </MenuIconWrap>
      ),
      onSelect: onRevert,
    });
  }

  if (canDelete) {
    items.push({
      id: "delete-import",
      label: i18n.t("pages.earningsImport.deleteImportAction"),
      icon: (
        <MenuIconWrap tone="danger">
          <DeleteIcon />
        </MenuIconWrap>
      ),
      onSelect: onDelete,
    });
  }

  return items;
}
