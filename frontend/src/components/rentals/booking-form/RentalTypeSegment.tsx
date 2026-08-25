import { useTranslation } from "react-i18next";

type RentalType = "daily" | "weekly" | "monthly";

type RentalTypeSegmentProps = {
  value: RentalType;
  onChange: (v: RentalType) => void;
  disabled?: boolean;
};

const OPTIONS: { value: RentalType; key: "rentalTypeDaily" | "rentalTypeWeekly" | "rentalTypeMonthly" }[] = [
  { value: "daily", key: "rentalTypeDaily" },
  { value: "weekly", key: "rentalTypeWeekly" },
  { value: "monthly", key: "rentalTypeMonthly" },
];

export function RentalTypeSegment({ value, onChange, disabled }: RentalTypeSegmentProps) {
  const { t } = useTranslation();
  return (
    <div className="fm-rental-booking-form__segment-group" role="group" aria-label={t("pages.bookingForm.rentalTypeGroupAriaLabel")}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          className={`fm-rental-booking-form__segment ${
            value === opt.value ? "fm-rental-booking-form__segment--active" : ""
          }`}
          onClick={() => onChange(opt.value)}
        >
          {t(`pages.bookingForm.${opt.key}`)}
        </button>
      ))}
    </div>
  );
}
