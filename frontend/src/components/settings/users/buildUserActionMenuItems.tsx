import type { OrgUser } from "../../../api/users";
import type { ActionMenuItemConfig } from "../../theme/ActionMenuDropdown";

function MenuIconWrap({ children, tone }: { children: React.ReactNode; tone: "muted" | "danger" | "brand" }) {
  const toneClass =
    tone === "danger"
      ? "bg-danger/10 text-danger"
      : tone === "brand"
        ? "bg-brand/10 text-brand"
        : "bg-ink/5 text-ink-muted";
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
      {children}
    </span>
  );
}

type BuildUserActionMenuItemsArgs = {
  user: OrgUser;
  onEdit: () => void;
  onResetPassword: () => void;
  onDeactivate: () => void;
  onActivate: () => void;
};

export function buildUserActionMenuItems({
  user,
  onEdit,
  onResetPassword,
  onDeactivate,
  onActivate,
}: BuildUserActionMenuItemsArgs): ActionMenuItemConfig[] {
  const items: ActionMenuItemConfig[] = [
    {
      id: "edit",
      label: "Edit user",
      icon: (
        <MenuIconWrap tone="brand">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onEdit,
    },
    {
      id: "reset-password",
      label: "Reset password",
      icon: (
        <MenuIconWrap tone="muted">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 11-12 0 6 6 0 0112 0zm-6 3v2m0 4h.01"
            />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onResetPassword,
    },
  ];

  if (user.isActive) {
    items.push({
      id: "deactivate",
      label: "Deactivate",
      icon: (
        <MenuIconWrap tone="danger">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onDeactivate,
    });
  } else {
    items.push({
      id: "activate",
      label: "Activate",
      icon: (
        <MenuIconWrap tone="brand">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </MenuIconWrap>
      ),
      onSelect: onActivate,
    });
  }

  return items;
}
