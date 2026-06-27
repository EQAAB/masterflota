import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { btnPrimary, emptyStateWrap } from "../../theme/classNames";

export type EmptyStateAction = {
  label: string;
  onClick?: () => void;
  /** In-app route (respects router basename, e.g. /fleet). */
  to?: string;
  /** External URL only; use `to` for in-app navigation. */
  href?: string;
};

export interface EmptyStateProps {
  title: string;
  description?: string;
  illustration?: ReactNode;
  action?: EmptyStateAction;
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
        (action.onClick ? (
          <button type="button" onClick={action.onClick} className={`${btnPrimary} mt-4 text-sm`}>
            {action.label}
          </button>
        ) : action.to ? (
          <Link to={action.to} className={`${btnPrimary} mt-4 text-sm inline-flex`}>
            {action.label}
          </Link>
        ) : action.href ? (
          <a href={action.href} className={`${btnPrimary} mt-4 text-sm`}>
            {action.label}
          </a>
        ) : null)}
    </div>
  );
}
