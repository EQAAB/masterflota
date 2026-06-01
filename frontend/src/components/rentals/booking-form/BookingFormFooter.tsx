import { btnPrimary, btnSecondary } from "../../../theme/classNames";

type BookingFormFooterProps = {
  isEdit: boolean;
  onCancel: () => void;
  onSaveDraft: () => void;
  saveDraftPending?: boolean;
  createPending?: boolean;
  disabled?: boolean;
};

export function BookingFormFooter({
  isEdit,
  onCancel,
  onSaveDraft,
  saveDraftPending,
  createPending,
  disabled,
}: BookingFormFooterProps) {
  return (
    <div className="fm-rental-booking-form__footer">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" className={btnSecondary} onClick={onCancel} disabled={createPending}>
          Cancel
        </button>
        <button
          type="button"
          className={btnSecondary}
          onClick={onSaveDraft}
          disabled={disabled || saveDraftPending || createPending}
        >
          {saveDraftPending ? "Saving…" : "Save draft"}
        </button>
        <button
          type="submit"
          className={`${btnPrimary} fm-rental-booking-form__cta`}
          disabled={disabled || createPending || saveDraftPending}
        >
          {createPending ? "Creating…" : isEdit ? "Save changes" : "Create booking"}
        </button>
      </div>
    </div>
  );
}
