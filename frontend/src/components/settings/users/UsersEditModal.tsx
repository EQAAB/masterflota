import { useTranslation } from "react-i18next";
import type { OrgUser } from "../../../api/users";
import { btnPrimary, btnSecondary, input, sectionLabel } from "../../../theme/classNames";
import { fullName } from "./usersListUtils";

export type EditUserForm = {
  firstName: string;
  lastName: string;
};

type UsersEditModalProps = {
  user: OrgUser | null;
  form: EditUserForm;
  onChange: (patch: Partial<EditUserForm>) => void;
  onClose: () => void;
  onSave: () => void;
  isPending: boolean;
};

export function UsersEditModal({ user, form, onChange, onClose, onSave, isPending }: UsersEditModalProps) {
  const { t } = useTranslation();
  if (!user) return null;

  return (
    <div className="fm-settings-users__modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="fm-settings-users__modal"
        role="dialog"
        aria-labelledby="edit-user-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="edit-user-title" className="text-lg font-semibold text-ink">
              {t("pages.users.editUserTitle")}
            </h2>
            <p className="mt-0.5 text-sm text-ink-muted">{fullName(user)} · {user.email}</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink"
            aria-label={t("common.close")}
            onClick={onClose}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={btnSecondary} onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button type="button" className={btnPrimary} disabled={isPending} onClick={onSave}>
            {t("pages.users.saveChangesButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
