import type { CustomerType } from "./customerFormUtils";

type CustomerTypeSegmentProps = {
  value: CustomerType;
  onChange: (v: CustomerType) => void;
};

const OPTIONS: { value: CustomerType; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "company", label: "Company" },
];

export function CustomerTypeSegment({ value, onChange }: CustomerTypeSegmentProps) {
  return (
    <div className="fm-rental-customer-form__segment-group" role="group" aria-label="Customer type">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`fm-rental-customer-form__segment ${
            value === opt.value ? "fm-rental-customer-form__segment--active" : ""
          }`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
