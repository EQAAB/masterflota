import type { RoleItem } from "../../../api/roles";
import type { UsersFilters } from "./usersListUtils";

type UsersFilterPanelProps = {
  filters: UsersFilters;
  roles: RoleItem[];
  onChange: (patch: Partial<UsersFilters>) => void;
  onClear: () => void;
};

export function UsersFilterPanel({ filters, roles, onChange, onClear }: UsersFilterPanelProps) {
  const hasFilters = filters.roleId !== "" || filters.status !== "";

  return (
    <div className="fm-settings-users__filter-panel mb-5">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="fm-settings-users__filter-select"
          value={filters.roleId}
          onChange={(e) => onChange({ roleId: e.target.value })}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          className="fm-settings-users__filter-select"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value as UsersFilters["status"] })}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {hasFilters && (
          <button type="button" className="text-sm font-medium text-brand hover:underline" onClick={onClear}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
