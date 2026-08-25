import { useTranslation } from "react-i18next";
import type { RoleItem } from "../../../api/roles";
import { PasswordInput } from "../../../components/theme/PasswordInput";
import { btnPrimary, input, sectionLabel } from "../../../theme/classNames";

export type AddUserForm = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
};

type UsersAddFormCardProps = {
  form: AddUserForm;
  onChange: (patch: Partial<AddUserForm>) => void;
  roles: RoleItem[];
  onSubmit: () => void;
  isPending: boolean;
};

export function UsersAddFormCard({ form, onChange, roles, onSubmit, isPending }: UsersAddFormCardProps) {
  const { t } = useTranslation();
  const defaultRoleId = form.roleId || roles[0]?.id || "";

  return (
    <div className="fm-settings-users__add-card mb-5 space-y-4">
      <h2 className="text-sm font-semibold text-[#0F172A]">{t("pages.users.newUserTitle")}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={sectionLabel}>{t("pages.users.emailLabel")}</label>
          <input
            className={input}
            value={form.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </div>
        <PasswordInput
          label={t("pages.users.passwordLabel")}
          value={form.password}
          onChange={(password) => onChange({ password })}
          helperText={t("pages.users.passwordHelperText")}
        />
        <div>
          <label className={sectionLabel}>{t("pages.users.firstNameLabel")}</label>
          <input
            className={input}
            value={form.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
          />
        </div>
        <div>
          <label className={sectionLabel}>{t("pages.users.lastNameLabel")}</label>
          <input
            className={input}
            value={form.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
          />
        </div>
        <div>
          <label className={sectionLabel}>{t("pages.users.roleFieldLabel")}</label>
          <select
            className={input}
            value={defaultRoleId}
            onChange={(e) => onChange({ roleId: e.target.value })}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="button" className={btnPrimary} disabled={isPending} onClick={onSubmit}>
        {t("pages.users.createUserButton")}
      </button>
    </div>
  );
}
