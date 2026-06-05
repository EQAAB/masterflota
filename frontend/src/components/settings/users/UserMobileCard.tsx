import type { OrgUser } from "../../../api/users";
import type { RoleItem } from "../../../api/roles";
import { roleOptionLabel, fullName, initialsFromUser } from "./usersListUtils";

type UserMobileCardProps = {
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

export function UserMobileCard({
  user,
  roles,
  onRoleChange,
  onEdit,
  onDeactivate,
  onActivate,
  onActionMenuToggle,
  isMenuOpen,
  isUpdating,
}: UserMobileCardProps) {
  return (
    <article className="fm-settings-users__mobile-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="fm-settings-users__avatar">{initialsFromUser(user)}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-ink">{fullName(user)}</p>
              {user.role === "super_admin" && (
                <span className="fm-settings-users__admin-badge">Primary Admin</span>
              )}
            </div>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          className="fm-settings-users__icon-btn shrink-0"
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`fm-settings-users__status-pill ${
            user.isActive
              ? "fm-settings-users__status-pill--active"
              : "fm-settings-users__status-pill--inactive"
          }`}
        >
          {user.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs text-ink-muted">Role</label>
        <select
          className="fm-settings-users__role-select w-full max-w-none"
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
      </div>

      <div className="mt-3 flex items-center gap-1">
        <button type="button" className="fm-settings-users__icon-btn" aria-label="Edit user" onClick={() => onEdit(user)}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        {user.isActive ? (
          <button
            type="button"
            className="fm-settings-users__icon-btn hover:bg-rose-50 hover:text-rose-700"
            aria-label="Deactivate user"
            onClick={() => onDeactivate(user)}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            className="fm-settings-users__icon-btn hover:bg-emerald-50 hover:text-emerald-700"
            aria-label="Activate user"
            onClick={() => onActivate(user)}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
      </div>
    </article>
  );
}
