import { EXTRA_SERVICES } from "./bookingFormConstants";

type ExtraServicesChipsProps = {
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function ExtraServicesChips({ selected, onChange, disabled }: ExtraServicesChipsProps) {
  const toggle = (id: string) => {
    if (disabled) return;
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {EXTRA_SERVICES.map((svc) => {
        const isOn = selected.includes(svc.id);
        return (
          <button
            key={svc.id}
            type="button"
            disabled={disabled}
            className={`fm-rental-booking-form__chip ${
              isOn ? "fm-rental-booking-form__chip--selected" : ""
            }`}
            onClick={() => toggle(svc.id)}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                isOn ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"
              }`}
              aria-hidden
            >
              {isOn ? "✓" : ""}
            </span>
            {svc.label}
            <span className="text-xs text-ink-muted">+{svc.amount}</span>
          </button>
        );
      })}
    </div>
  );
}
