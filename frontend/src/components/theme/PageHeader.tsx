import { Link } from "react-router-dom";
import { pageSubtitle, pageTitle } from "../../theme/classNames";

export type BreadcrumbItem = { label: string; to?: string };

type PageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={`shrink-0 border-b border-border bg-white/80 backdrop-blur-md px-4 sm:px-6 py-5 ${className}`}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="text-xs text-ink-muted mb-2 flex flex-wrap items-center gap-1">
          {breadcrumbs.map((item, i) => (
            <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1.5">
              {i > 0 && <span className="text-border">/</span>}
              {item.to ? (
                <Link to={item.to} className="hover:text-brand hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className="text-ink font-medium">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={pageTitle}>{title}</h1>
          {description && <div className={pageSubtitle}>{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
