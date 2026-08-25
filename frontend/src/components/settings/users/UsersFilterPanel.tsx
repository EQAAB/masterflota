import { useTranslation } from "react-i18next";
import type { RoleItem } from "../../../api/roles";
import type { UsersFilters } from "./usersListUtils";

type UsersFilterPanelProps = {
  filters: UsersFilters;
  roles: RoleItem[];
  onChange: (patch: Partial<UsersFilters>) => void;
  onClear: () => void;
};

export function UsersFilterPanel({ filters, roles, onChange, onClear }: UsersFilterPanelProps) {
  const { t } = useTranslation();
  const hasFilters = filters.roleId !== "" || filters.status !== "";

  return (
    <div className="fm-settings-users__filter-panel mb-5">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="fm-settings-users__filter-select"
          value={filters.roleId}
          onChange={(e) => onChange({ roleId: e.target.value })}
          aria-label={t("pages.users.filterByRoleAria")}
        >
          <option value="">{t("pages.users.allRolesOption")}</option>
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
          aria-label={t("pages.users.filterByStatusAria")}
        >
          <option value="">{t("pages.users.allStatusesOption")}</option>
          <option value="active">{t("status.active")}</option>
          <option value="inactive">{t("status.inactive")}</option>
        </select>

        {hasFilters && (
          <button type="button" className="text-sm font-medium text-brand hover:underline" onClick={onClear}>
            {t("pages.users.clearFiltersButton")}
          </button>
        )}
      </div>
    </div>
  );
}
