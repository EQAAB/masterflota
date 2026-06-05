import type { PermissionItem } from "../../../api/roles";
import { groupPermissionsByModule } from "./rolesListUtils";

type RolePermissionMatrixProps = {
  permissions: PermissionItem[];
  granted: Set<string>;
  readOnly: boolean;
  saving?: boolean;
  onToggle: (permissionName: string, enabled: boolean) => void;
};

export function RolePermissionMatrix({
  permissions,
  granted,
  readOnly,
  saving,
  onToggle,
}: RolePermissionMatrixProps) {
  const byModule = groupPermissionsByModule(permissions);
  const modules = [...byModule.keys()].sort();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {modules.map((mod) => (
        <div key={mod} className="fm-settings-roles__perm-module">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{mod}</h3>
          <ul className="space-y-2">
            {(byModule.get(mod) ?? []).map((p) => {
              const checked = granted.has(p.name);
              return (
                <li key={p.id}>
                  <label
                    className={`fm-settings-roles__perm-toggle ${readOnly ? "fm-settings-roles__perm-toggle--readonly" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={readOnly || saving}
                      onChange={(e) => onToggle(p.name, e.target.checked)}
                      className="rounded border-slate-300 text-brand focus:ring-brand/30"
                    />
                    <span className="min-w-0">
                      <span className={`block text-sm ${checked ? "text-ink" : "text-ink-muted"}`}>{p.name}</span>
                      {p.description && (
                        <span className="block text-xs text-ink-muted">{p.description}</span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
