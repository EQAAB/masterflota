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
          Create custom role
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Custom roles can be edited and assigned permissions.</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className={sectionLabel}>Role name</label>
            <input
              className={input}
              placeholder="e.g. Fleet coordinator"
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </div>
          <div>
            <label className={sectionLabel}>Description</label>
            <input
              className={input}
              placeholder="Optional description"
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} disabled={isPending || !form.name.trim()} onClick={onSubmit}>
            Create role
          </button>
        </div>
      </div>
    </div>
  );
}
