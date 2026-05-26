import type { ReactNode } from "react";
import { kpiCard } from "../../theme/classNames";

export interface KpiStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; positive?: boolean };
  icon?: ReactNode;
  iconClassName?: string;
  className?: string;
}

function IconCircle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-mint/80 text-brand ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function KpiStatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconClassName,
  className = "",
}: KpiStatCardProps) {
  const trendPositive = trend?.positive !== false;
  const trendClass = trendPositive ? "text-success" : trend?.positive === false ? "text-danger" : "text-warning";

  return (
    <div className={`${kpiCard} ${className}`}>
      <div className="flex flex-1 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{title}</p>
          <p className="fm-kpi-value mt-2 truncate">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
          {trend && (
            <span className={`mt-2 inline-flex items-center text-xs font-medium ${trendClass}`}>
              {trend.value}
            </span>
          )}
        </div>
        {icon && <IconCircle className={iconClassName}>{icon}</IconCircle>}
      </div>
    </div>
  );
}
