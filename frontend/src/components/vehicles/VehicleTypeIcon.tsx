import type { NormalizedVehicleType } from "../../utils/vehicleTypeDisplay";
import { normalizeVehicleType } from "../../utils/vehicleTypeDisplay";

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M5 17h14M5 17a2 2 0 01-2-2v-3a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 01-2 2M5 17v1a1 1 0 001 1h1a1 1 0 001-1v-1M19 17v1a1 1 0 001 1h1a1 1 0 001-1v-1M7 12h10M9 7l1-2h4l1 2"
      />
    </svg>
  );
}

function ScooterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <circle cx="6" cy="17" r="2.5" strokeWidth={1.75} />
      <circle cx="18" cy="17" r="2.5" strokeWidth={1.75} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M8.5 17h7M10 12l2-4h4l2 4M12 8V5"
      />
    </svg>
  );
}

function CycleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <circle cx="6" cy="17" r="2.5" strokeWidth={1.75} />
      <circle cx="18" cy="17" r="2.5" strokeWidth={1.75} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M8.5 17l3-8 3 3 2.5-3H20M11 9l-2-2"
      />
    </svg>
  );
}

function VanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3 8l2-3h11l3 3v9a1 1 0 01-1 1h-1a2 2 0 01-4 0H9a2 2 0 01-4 0H4a1 1 0 01-1-1V8zM6 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zM15 17a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z"
      />
    </svg>
  );
}

function DefaultIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M8 7h8m-8 4h8m-8 4h5M5 5a2 2 0 012-2h10a2 2 0 012 2v14l-3-2-3 2-3-2-3 2-3-2V5z"
      />
    </svg>
  );
}

function iconForType(type: NormalizedVehicleType) {
  if (type === "car") return CarIcon;
  if (type === "scooter") return ScooterIcon;
  if (type === "cycle") return CycleIcon;
  if (type === "van") return VanIcon;
  return DefaultIcon;
}

type VehicleTypeIconProps = {
  vehicleType: string | null | undefined;
  className?: string;
};

export function VehicleTypeIcon({ vehicleType, className = "" }: VehicleTypeIconProps) {
  const normalized = normalizeVehicleType(vehicleType);
  const Icon = iconForType(normalized);

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-mint text-brand ${className}`}
      aria-hidden
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}
