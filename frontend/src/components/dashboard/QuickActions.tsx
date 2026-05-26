import { Link } from "react-router-dom";

export interface QuickActionItem {
  label: string;
  to?: string;
  onClick?: () => void;
}

export function QuickActions({ actions }: { actions: QuickActionItem[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) =>
        action.to ? (
          <Link
            key={action.label}
            to={action.to}
            className="inline-flex items-center rounded-md bg-brand-gradient px-3 py-2 text-sm font-medium text-white hover:opacity-95"
          >
            {action.label}
          </Link>
        ) : (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick ?? (() => {})}
            className="inline-flex items-center rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50"
          >
            {action.label}
          </button>
        ),
      )}
    </div>
  );
}
