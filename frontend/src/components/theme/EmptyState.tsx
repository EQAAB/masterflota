import type { ReactNode } from "react";
import { btnPrimary, emptyStateWrap } from "../../theme/classNames";

export interface EmptyStateProps {
  title: string;
  description?: string;
  illustration?: ReactNode;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}

export function EmptyState({
  title,
  description,
  illustration,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`${emptyStateWrap} ${className}`}>
      {illustration && <div className="mb-4 text-brand/40">{illustration}</div>}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action &&
        (action.href ? (
          <a href={action.href} className={`${btnPrimary} mt-4 text-sm`}>
            {action.label}
          </a>
        ) : (
          <button type="button" onClick={action.onClick} className={`${btnPrimary} mt-4 text-sm`}>
            {action.label}
          </button>
        ))}
    </div>
  );
}
