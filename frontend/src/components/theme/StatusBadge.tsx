const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  processing: "bg-brand-mint text-brand",
  approved: "bg-brand/10 text-brand",
  paid: "bg-success/10 text-success",
  failed: "bg-danger/10 text-danger",
  hold: "bg-warning/10 text-warning",
  debt: "bg-danger/10 text-danger",
};

type StatusBadgeProps = {
  status: string;
  className?: string;
  children?: React.ReactNode;
};

export function statusBadgeClass(status: string): string {
  return STATUS_STYLES[status] ?? "bg-surface text-ink-muted border border-border";
}

export function StatusBadge({ status, className = "", children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusBadgeClass(status)} ${className}`}
    >
      {children ?? status}
    </span>
  );
}
