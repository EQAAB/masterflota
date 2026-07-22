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

function ViewIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

function AssignIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7zM19 8v6m3-3h-6" />
    </svg>
  );
}

function StatusIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
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

type BuildVehicleActionMenuItemsArgs = {
  canEdit: boolean;
  canAssign: boolean;
  canDelete: boolean;
  onView: () => void;
  onEdit: () => void;
  onAssignDriver: () => void;
  onChangeStatus: () => void;
  onDelete: () => void;
};

export function buildVehicleActionMenuItems({
  canEdit,
  canAssign,
  canDelete,
  onView,
  onEdit,
  onAssignDriver,
  onChangeStatus,
  onDelete,
}: BuildVehicleActionMenuItemsArgs): ActionMenuItemConfig[] {
  return [
    {
      id: "view-vehicle",
      label: "View vehicle",
      icon: (
        <MenuIconWrap tone="brand">
          <ViewIcon />
        </MenuIconWrap>
      ),
      onSelect: onView,
    },
    {
      id: "edit-vehicle",
      label: "Edit vehicle",
      icon: (
        <MenuIconWrap tone="muted">
          <EditIcon />
        </MenuIconWrap>
      ),
      onSelect: onEdit,
      hidden: !canEdit,
    },
    {
      id: "assign-driver",
      label: "Assign driver",
      icon: (
        <MenuIconWrap tone="brand">
          <AssignIcon />
        </MenuIconWrap>
      ),
      onSelect: onAssignDriver,
      hidden: !canAssign,
    },
    {
      id: "change-status",
      label: "Change status",
      icon: (
        <MenuIconWrap tone="muted">
          <StatusIcon />
        </MenuIconWrap>
      ),
      onSelect: onChangeStatus,
      hidden: !canEdit,
    },
    {
      id: "delete-vehicle",
      label: "Delete vehicle",
      icon: (
        <MenuIconWrap tone="danger">
          <DeleteIcon />
        </MenuIconWrap>
      ),
      onSelect: onDelete,
      hidden: !canDelete,
    },
  ];
}
