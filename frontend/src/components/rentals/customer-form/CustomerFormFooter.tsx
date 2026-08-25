import { useTranslation } from "react-i18next";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";

type CustomerFormFooterProps = {
  isEdit: boolean;
  pending: boolean;
  onCancel: () => void;
};

export function CustomerFormFooter({ isEdit, pending, onCancel }: CustomerFormFooterProps) {
  const { t } = useTranslation();
  return (
    <div className="fm-rental-customer-form__footer">
      <button type="button" className={btnSecondary} onClick={onCancel} disabled={pending}>
        {t("common.cancel")}
      </button>
      <button
        type="submit"
        className={`${btnPrimary} fm-rental-customer-form__cta`}
        disabled={pending}
      >
        {pending ? t("common.saving") : isEdit ? t("pages.bookingForm.saveChangesButton") : t("pages.bookingForm.saveCustomer")}
      </button>
    </div>
  );
}
