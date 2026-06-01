type RentalType = "daily" | "weekly" | "monthly";

type RentalTypeSegmentProps = {
  value: RentalType;
  onChange: (v: RentalType) => void;
  disabled?: boolean;
};

const OPTIONS: { value: RentalType; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function RentalTypeSegment({ value, onChange, disabled }: RentalTypeSegmentProps) {
  return (
    <div className="fm-rental-booking-form__segment-group" role="group" aria-label="Rental type">
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
          {opt.label}
        </button>
      ))}
    </div>
  );
}
