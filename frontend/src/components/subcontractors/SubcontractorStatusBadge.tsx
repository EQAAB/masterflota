const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success ring-1 ring-success/20",
  inactive: "bg-danger/10 text-danger ring-1 ring-danger/20",
};

export function SubcontractorStatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase() ?? "";
  const style = STATUS_STYLES[normalized] ?? "bg-surface text-ink-muted ring-1 ring-border";
  const label = normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Unknown";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
