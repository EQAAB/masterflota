import type { OrgUser } from "../../../api/users";
import type { RoleItem } from "../../../api/roles";
import { roleOptionLabel, fullName, initialsFromUser } from "./usersListUtils";

type UserTableRowProps = {
  user: OrgUser;
  roles: RoleItem[];
  onRoleChange: (id: string, roleId: string) => void;
  onEdit: (user: OrgUser) => void;
  onDeactivate: (user: OrgUser) => void;
  onActivate: (user: OrgUser) => void;
  onActionMenuToggle: (userId: string, el: HTMLElement) => void;
  isMenuOpen: boolean;
  isUpdating: boolean;
};

function IconButton({
  label,
  onClick,
  children,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "default" | "danger" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "hover:bg-rose-50 hover:text-rose-700"
      : tone === "success"
        ? "hover:bg-emerald-50 hover:text-emerald-700"
        : "hover:bg-slate-100 hover:text-ink";
  return (
    <button
      type="button"
      className={`fm-settings-users__icon-btn ${toneClass}`}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function UserTableRow({
  user,
  roles,
  onRoleChange,
  onEdit,
  onDeactivate,
  onActivate,
  onActionMenuToggle,
  isMenuOpen,
  isUpdating,
}: UserTableRowProps) {
  return (
    <tr className="fm-settings-users__row">
      <td>
        <div className="flex items-center gap-3">
          <span className="fm-settings-users__avatar">{initialsFromUser(user)}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-ink">{fullName(user)}</p>
              {user.role === "super_admin" && (
                <span className="fm-settings-users__admin-badge">Primary Admin</span>
              )}
            </div>
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
          <span className="truncate">{user.email}</span>
        </div>
      </td>
      <td>
        <select
          className="fm-settings-users__role-select"
          value={user.roleId}
          disabled={isUpdating}
          onChange={(e) => onRoleChange(user.id, e.target.value)}
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {roleOptionLabel(r)}
            </option>
          ))}
        </select>
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
      <td className="text-right">
        <div className="inline-flex items-center justify-end gap-0.5">
          <IconButton label="Edit user" onClick={() => onEdit(user)}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </IconButton>

          {user.isActive ? (
            <IconButton label="Deactivate user" tone="danger" onClick={() => onDeactivate(user)}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </IconButton>
          ) : (
            <IconButton label="Activate user" tone="success" onClick={() => onActivate(user)}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 13l4 4L19 7" />
              </svg>
            </IconButton>
          )}

          <button
            type="button"
            className="fm-settings-users__icon-btn hover:bg-slate-100 hover:text-ink"
            aria-label="More actions"
            aria-expanded={isMenuOpen}
            onClick={(e) => onActionMenuToggle(user.id, e.currentTarget)}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}
