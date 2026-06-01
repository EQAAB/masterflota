import { btnPrimary, btnSecondary } from "../../../theme/classNames";

type CustomerFormFooterProps = {
  isEdit: boolean;
  pending: boolean;
  onCancel: () => void;
};

export function CustomerFormFooter({ isEdit, pending, onCancel }: CustomerFormFooterProps) {
  return (
    <div className="fm-rental-customer-form__footer">
      <button type="button" className={btnSecondary} onClick={onCancel} disabled={pending}>
        Cancel
      </button>
      <button
        type="submit"
        className={`${btnPrimary} fm-rental-customer-form__cta`}
        disabled={pending}
      >
        {pending ? "Saving…" : isEdit ? "Save changes" : "Save customer"}
      </button>
    </div>
  );
}
