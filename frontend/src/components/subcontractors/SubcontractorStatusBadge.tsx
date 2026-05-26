const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-danger/10 text-danger",
};

export function SubcontractorStatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase() ?? "";
  const style = STATUS_STYLES[normalized] ?? "bg-surface text-ink-muted ring-1 ring-border";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${style}`}>
      {normalized || "unknown"}
    </span>
  );
}
