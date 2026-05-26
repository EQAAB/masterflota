import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { chartCard, linkAccent } from "../../theme/classNames";

export interface DashboardChartCardProps {
  title: string;
  description?: string;
  action?: { label: string; to: string };
  children: ReactNode;
  className?: string;
  minHeight?: number;
}

export function DashboardChartCard({
  title,
  description,
  action,
  children,
  className = "",
  minHeight,
}: DashboardChartCardProps) {
  return (
    <div className={`${chartCard} flex flex-col ${className}`} style={minHeight ? { minHeight } : undefined}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
        </div>
        {action && (
          <Link to={action.to} className={`${linkAccent} text-sm shrink-0`}>
            {action.label} →
          </Link>
        )}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
