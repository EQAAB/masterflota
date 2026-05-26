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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 11h-6m3-3l-3 3 3 3" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6M5 5h14v14H5V5z" />
    </svg>
  );
}

function DisableIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  );
}

type BuildSubcontractorActionMenuItemsArgs = {
  isActive: boolean;
  onView: () => void;
  onEdit: () => void;
  onAssignDrivers: () => void;
  onViewReports: () => void;
  onDisable: () => void;
};

export function buildSubcontractorActionMenuItems({
  isActive,
  onView,
  onEdit,
  onAssignDrivers,
  onViewReports,
  onDisable,
}: BuildSubcontractorActionMenuItemsArgs): ActionMenuItemConfig[] {
  return [
    {
      id: "view-subcontractor",
      label: "View subcontractor",
      icon: (
        <MenuIconWrap tone="brand">
          <ViewIcon />
        </MenuIconWrap>
      ),
      onSelect: onView,
    },
    {
      id: "edit-subcontractor",
      label: "Edit subcontractor",
      icon: (
        <MenuIconWrap tone="muted">
          <EditIcon />
        </MenuIconWrap>
      ),
      onSelect: onEdit,
    },
    {
      id: "assign-drivers",
      label: "Assign drivers",
      icon: (
        <MenuIconWrap tone="brand">
          <AssignIcon />
        </MenuIconWrap>
      ),
      onSelect: onAssignDrivers,
    },
    {
      id: "view-reports",
      label: "View reports",
      icon: (
        <MenuIconWrap tone="muted">
          <ReportsIcon />
        </MenuIconWrap>
      ),
      onSelect: onViewReports,
    },
    {
      id: "disable-subcontractor",
      label: "Disable subcontractor",
      icon: (
        <MenuIconWrap tone="danger">
          <DisableIcon />
        </MenuIconWrap>
      ),
      onSelect: onDisable,
      hidden: !isActive,
    },
  ];
}
