import { card, cardHover } from "../../theme/classNames";

type DashboardCardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
};

export function DashboardCard({
  children,
  className = "",
  hover = false,
  padding = true,
}: DashboardCardProps) {
  const base = hover ? cardHover : card;
  return (
    <div className={`${base} ${padding ? "" : "p-0"} ${className}`.trim()}>{children}</div>
  );
}
