import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { chartCard, linkAccent } from "../../../theme/classNames";

type RentalDashboardCardProps = {
  title: string;
  viewAllTo?: string;
  viewAllLabel?: string;
  children: ReactNode;
  className?: string;
};

export function RentalDashboardCard({
  title,
  viewAllTo,
  viewAllLabel = "View all",
  children,
  className = "",
}: RentalDashboardCardProps) {
  return (
    <div className={`${chartCard} flex flex-col ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {viewAllTo && (
          <Link to={viewAllTo} className={`${linkAccent} text-xs font-medium shrink-0`}>
            {viewAllLabel} →
          </Link>
        )}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
