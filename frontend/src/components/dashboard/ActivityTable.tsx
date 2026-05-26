import type { ReactNode } from "react";

export interface ActivityRow {
  id: string;
  description: string;
  meta?: string;
  time: string;
  type?: "default" | "success" | "warning" | "info";
}

export interface ActivityTableProps {
  title?: string;
  rows: ActivityRow[];
  emptyMessage?: string;
  className?: string;
  action?: ReactNode;
}

export function ActivityTable({
  title = "Recent activity",
  rows,
  emptyMessage = "No activity yet.",
  className = "",
  action,
}: ActivityTableProps) {
  return (
    <div
      className={`
        rounded-xl border border-border
        bg-white overflow-hidden shadow-sm
        ${className}
      `}
    >
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {action}
      </div>
      <div className="overflow-x-auto">
        {rows.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-ink-muted">
            {emptyMessage}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left font-medium text-ink-muted">Activity</th>
                <th className="px-5 py-3 text-right font-medium text-ink-muted">Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`
                          shrink-0 w-2 h-2 rounded-full
                          ${row.type === "success" ? "bg-emerald-500" : ""}
                          ${row.type === "warning" ? "bg-amber-500" : ""}
                          ${row.type === "info" ? "bg-brand-mint0" : ""}
                          ${!row.type || row.type === "default" ? "bg-slate-400" : ""}
                        `}
                      />
                      <div>
                        <p className="font-medium text-ink">{row.description}</p>
                        {row.meta && (
                          <p className="text-xs text-ink-muted">{row.meta}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-ink-muted whitespace-nowrap">
                    {row.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
