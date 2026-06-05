import type { OrgUser } from "../../../api/users";
import type { RoleItem } from "../../../api/roles";
import { roleOptionLabel, roleBadgeLabel, roleBadgeVariant, fullName, initialsFromUser } from "./usersListUtils";

type UserTableRowProps = {
  user: OrgUser;
  roles: RoleItem[];
  roleEditing: boolean;
  onRoleEditStart: (userId: string) => void;
  onRoleEditEnd: () => void;
  onRoleChange: (id: string, roleId: string) => void;
  onEdit: (user: OrgUser) => void;
  onDeactivate: (user: OrgUser) => void;
  onActivate: (user: OrgUser) => void;
  onActionMenuToggle: (userId: string, el: HTMLElement) => void;
  isMenuOpen: boolean;
  isUpdating: boolean;
};

function ActionButton({
  label,
  onClick,
  variant = "more",
  ariaExpanded,
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "edit" | "danger" | "success" | "more";
  ariaExpanded?: boolean;
  children: React.ReactNode;
}) {
  const variantClass =
    variant === "edit"
      ? "fm-settings-users__action-btn--edit"
      : variant === "danger"
        ? "fm-settings-users__action-btn--danger"
        : variant === "success"
          ? "fm-settings-users__action-btn--success"
          : "fm-settings-users__action-btn--more";

  return (
    <button
      type="button"
      className={`fm-settings-users__action-btn ${variantClass}`}
      aria-label={label}
      aria-expanded={ariaExpanded}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function UserTableRow({
  user,
  roles,
  roleEditing,
  onRoleEditStart,
  onRoleEditEnd,
  onRoleChange,
  onEdit,
  onDeactivate,
  onActivate,
  onActionMenuToggle,
  isMenuOpen,
  isUpdating,
}: UserTableRowProps) {
  const badgeVariant = roleBadgeVariant(user.role);

  const roleIcon =
    badgeVariant === "super_admin" ? (
      <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ) : badgeVariant === "admin" ? (
      <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ) : null;

  return (
    <tr className="fm-settings-users__row">
      <td>
        <div className="flex items-start gap-3">
          <span className="fm-settings-users__avatar">{initialsFromUser(user)}</span>
          <div className="min-w-0">
            <p className="font-semibold text-ink">{fullName(user)}</p>
            {user.role === "super_admin" && (
              <span className="fm-settings-users__admin-badge">Primary Admin</span>
            )}
          </div>
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <svg
            className="h-4 w-4 shrink-0 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="min-w-0 max-lg:truncate lg:overflow-visible lg:whitespace-normal">
            {user.email}
          </span>
        </div>
      </td>
      <td>
        <div className="min-w-0">
        {roleEditing ? (
          <select
            className="fm-settings-users__role-select fm-settings-users__role-select--compact"
            value={user.roleId}
            disabled={isUpdating}
            autoFocus
            onChange={(e) => {
              onRoleChange(user.id, e.target.value);
              onRoleEditEnd();
            }}
            onBlur={onRoleEditEnd}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {roleOptionLabel(r)}
              </option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            className={`fm-settings-users__role-badge fm-settings-users__role-badge--${badgeVariant}`}
            title="Click to change role"
            disabled={isUpdating}
            onClick={() => onRoleEditStart(user.id)}
          >
            {roleIcon}
            {roleBadgeLabel(user.role)}
          </button>
        )}
        </div>
      </td>
      <td>
        <span
          className={`fm-settings-users__status-pill ${
            user.isActive
              ? "fm-settings-users__status-pill--active"
              : "fm-settings-users__status-pill--inactive"
          }`}
        >
          {user.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="fm-settings-users__col-actions text-right">
        <div className="fm-settings-users__action-group">
          <ActionButton label="Edit user" variant="edit" onClick={() => { onEdit(user); }}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </ActionButton>

          {user.isActive ? (
            <ActionButton label="Deactivate user" variant="danger" onClick={() => { onDeactivate(user); }}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </ActionButton>
          ) : (
            <ActionButton label="Activate user" variant="success" onClick={() => { onActivate(user); }}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 13l4 4L19 7" />
              </svg>
            </ActionButton>
          )}

          <ActionButton
            label="More actions"
            variant="more"
            ariaExpanded={isMenuOpen}
            onClick={(e) => onActionMenuToggle(user.id, e.currentTarget)}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </ActionButton>
        </div>
      </td>
    </tr>
  );
}
