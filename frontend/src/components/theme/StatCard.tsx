import { sectionLabel } from "../../theme/classNames";
import { IconCircle } from "./IconCircle";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  icon?: React.ReactNode;
  iconTint?: "brand" | "success" | "warning" | "danger" | "neutral";
  className?: string;
  valueClassName?: string;
};

export function StatCard({
  label,
  value,
  subtext,
  icon,
  iconTint = "brand",
  className = "",
  valueClassName = "text-2xl font-bold tabular-nums text-ink mt-1",
}: StatCardProps) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <p className={sectionLabel}>{label}</p>
        <p className={valueClassName}>{value}</p>
        {subtext && <p className="text-xs text-ink-muted mt-1">{subtext}</p>}
      </div>
      {icon && <IconCircle tint={iconTint}>{icon}</IconCircle>}
    </div>
  );
}
