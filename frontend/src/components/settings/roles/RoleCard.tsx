import type { RoleItem } from "../../../api/roles";
import type { PermissionItem } from "../../../api/roles";
import { roleLabel } from "../../../lib/roleLabel";
import { RolePermissionMatrix } from "./RolePermissionMatrix";

type RoleCardProps = {
  role: RoleItem;
  permissions: PermissionItem[];
  canManage: boolean;
  isSaving: boolean;
  onTogglePermission: (roleId: string, permissionName: string, enabled: boolean, current: string[]) => void;
  onDelete: (role: RoleItem) => void;
};

export function RoleCard({
  role,
  permissions,
  canManage,
  isSaving,
  onTogglePermission,
  onDelete,
}: RoleCardProps) {
  const granted = new Set(role.permissions);
  const readOnly = role.isSystemRole || !canManage;

  return (
    <article className="fm-settings-roles__card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">{roleLabel(role.name)}</h2>
          <p className="text-sm text-ink-muted">{role.description || "No description"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="fm-settings-roles__badge">
            {role.isSystemRole ? "System role" : "Custom role"}
            {role.isDefault ? " · Default" : ""}
          </span>
          {!role.isSystemRole && canManage && (
            <button
              type="button"
              className="text-sm font-medium text-rose-600 hover:underline"
              disabled={isSaving}
              onClick={() => onDelete(role)}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <RolePermissionMatrix
        permissions={permissions}
        granted={granted}
        readOnly={readOnly}
        saving={isSaving}
        onToggle={(name, enabled) => onTogglePermission(role.id, name, enabled, role.permissions)}
      />
    </article>
  );
}
