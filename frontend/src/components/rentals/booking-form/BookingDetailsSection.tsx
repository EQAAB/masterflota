import { useTranslation } from "react-i18next";

type BookingDetailsSectionProps = {
  pickupLocation: string;
  returnLocation: string;
  driverNotes: string;
  internalNotes: string;
  discountAmount: number;
  onPickupLocation: (v: string) => void;
  onReturnLocation: (v: string) => void;
  onDriverNotes: (v: string) => void;
  onInternalNotes: (v: string) => void;
  onDiscountAmount: (v: number) => void;
  disabled?: boolean;
};

export function BookingDetailsSection({
  pickupLocation,
  returnLocation,
  driverNotes,
  internalNotes,
  discountAmount,
  onPickupLocation,
  onReturnLocation,
  onDriverNotes,
  onInternalNotes,
  onDiscountAmount,
  disabled,
}: BookingDetailsSectionProps) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-ink">{t("pages.bookingForm.pickupLocation")}</label>
          <input
            type="text"
            disabled={disabled}
            className="fm-rental-booking-form__input mt-1.5"
            placeholder={t("pages.bookingForm.pickupLocationPlaceholder")}
            value={pickupLocation}
            onChange={(e) => onPickupLocation(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">{t("pages.bookingForm.returnLocation")}</label>
          <input
            type="text"
            disabled={disabled}
            className="fm-rental-booking-form__input mt-1.5"
            placeholder={t("pages.bookingForm.returnLocationPlaceholder")}
            value={returnLocation}
            onChange={(e) => onReturnLocation(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-ink">{t("pages.bookingForm.driverNotesLabel")}</label>
        <textarea
          rows={3}
          disabled={disabled}
          className="fm-rental-booking-form__textarea mt-1.5"
          placeholder={t("pages.bookingForm.driverNotesPlaceholder")}
          value={driverNotes}
          onChange={(e) => onDriverNotes(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink">{t("pages.bookingForm.internalNotesLabel")}</label>
        <textarea
          rows={3}
          disabled={disabled}
          className="fm-rental-booking-form__textarea mt-1.5"
          placeholder={t("pages.bookingForm.internalNotesPlaceholder")}
          value={internalNotes}
          onChange={(e) => onInternalNotes(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink">{t("pages.bookingForm.discountLabel")}</label>
        <input
          type="number"
          min={0}
          step={1}
          disabled={disabled}
          className="fm-rental-booking-form__input mt-1.5"
          value={discountAmount || ""}
          onChange={(e) => onDiscountAmount(Number(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}
