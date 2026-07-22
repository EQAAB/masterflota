import type { ActionMenuItemConfig } from "../theme/ActionMenuDropdown";

function MenuIconWrap({ children, tone }: { children: React.ReactNode; tone: "brand" | "muted" | "danger" }) {
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

function ViewProfileIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function SuspendIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  );
}

type BuildDriverActionMenuItemsArgs = {
  canEdit: boolean;
  canSuspend: boolean;
  onViewProfile: () => void;
  onEdit: () => void;
  onSuspend: () => void;
};

export function buildDriverActionMenuItems({
  canEdit,
  canSuspend,
  onViewProfile,
  onEdit,
  onSuspend,
}: BuildDriverActionMenuItemsArgs): ActionMenuItemConfig[] {
  return [
    {
      id: "view-profile",
      label: "View profile",
      icon: (
        <MenuIconWrap tone="brand">
          <ViewProfileIcon />
        </MenuIconWrap>
      ),
      onSelect: onViewProfile,
    },
    {
      id: "edit-driver",
      label: "Edit driver",
      icon: (
        <MenuIconWrap tone="muted">
          <EditIcon />
        </MenuIconWrap>
      ),
      onSelect: onEdit,
      hidden: !canEdit,
    },
    {
      id: "suspend-driver",
      label: "Suspend driver",
      icon: (
        <MenuIconWrap tone="danger">
          <SuspendIcon />
        </MenuIconWrap>
      ),
      onSelect: onSuspend,
      hidden: !canEdit || !canSuspend,
    },
  ];
}

export function driverRowHasActionMenu(): boolean {
  return true;
}
