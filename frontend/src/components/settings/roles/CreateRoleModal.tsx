import { useTranslation } from "react-i18next";
import { btnPrimary, btnSecondary, input, sectionLabel } from "../../../theme/classNames";

export type CreateRoleForm = {
  name: string;
  description: string;
};

type CreateRoleModalProps = {
  open: boolean;
  form: CreateRoleForm;
  onChange: (patch: Partial<CreateRoleForm>) => void;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
};

export function CreateRoleModal({ open, form, onChange, onClose, onSubmit, isPending }: CreateRoleModalProps) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fm-settings-roles__modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="fm-settings-roles__modal"
        role="dialog"
        aria-labelledby="create-role-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="create-role-title" className="text-lg font-semibold text-ink">
          {t("pages.roles.createCustomRoleTitle")}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{t("pages.roles.createCustomRoleDesc")}</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className={sectionLabel}>{t("pages.roles.roleNameLabel")}</label>
            <input
              className={input}
              placeholder={t("pages.roles.roleNamePlaceholder")}
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </div>
          <div>
            <label className={sectionLabel}>{t("pages.roles.descriptionLabel")}</label>
            <input
              className={input}
              placeholder={t("pages.roles.descriptionPlaceholder")}
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={btnSecondary} onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button type="button" className={btnPrimary} disabled={isPending || !form.name.trim()} onClick={onSubmit}>
            {t("pages.roles.add")}
          </button>
        </div>
      </div>
    </div>
  );
}
