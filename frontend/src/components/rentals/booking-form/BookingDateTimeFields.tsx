import { Trans, useTranslation } from "react-i18next";

type BookingDateTimeFieldsProps = {
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  onPickupDate: (v: string) => void;
  onPickupTime: (v: string) => void;
  onReturnDate: (v: string) => void;
  onReturnTime: (v: string) => void;
  rentalDays?: number | null;
  disabled?: boolean;
};

export function BookingDateTimeFields({
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  onPickupDate,
  onPickupTime,
  onReturnDate,
  onReturnTime,
  rentalDays,
  disabled,
}: BookingDateTimeFieldsProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink">{t("pages.bookingForm.pickupDate")}</label>
          <input
            type="date"
            required
            disabled={disabled}
            className="fm-rental-booking-form__input mt-1.5"
            value={pickupDate}
            onChange={(e) => onPickupDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">{t("pages.bookingForm.pickupTime")}</label>
          <input
            type="time"
            required
            disabled={disabled}
            className="fm-rental-booking-form__input mt-1.5"
            value={pickupTime}
            onChange={(e) => onPickupTime(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">{t("pages.bookingForm.returnDate")}</label>
          <input
            type="date"
            required
            disabled={disabled}
            className="fm-rental-booking-form__input mt-1.5"
            value={returnDate}
            min={pickupDate || undefined}
            onChange={(e) => onReturnDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">{t("pages.bookingForm.returnTime")}</label>
          <input
            type="time"
            required
            disabled={disabled}
            className="fm-rental-booking-form__input mt-1.5"
            value={returnTime}
            onChange={(e) => onReturnTime(e.target.value)}
          />
        </div>
      </div>
      {rentalDays != null && rentalDays > 0 && (
        <p className="text-sm font-medium text-brand">
          <Trans i18nKey="pages.bookingForm.rentalDaysCount" count={rentalDays} />
        </p>
      )}
    </div>
  );
}
