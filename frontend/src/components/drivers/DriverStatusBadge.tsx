const EMPLOYMENT_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success",
  suspended: "bg-danger/10 text-danger",
  terminated: "bg-surface text-ink-muted ring-1 ring-border",
};

export function DriverStatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase() ?? "";
  const style = EMPLOYMENT_STYLES[normalized] ?? "bg-surface text-ink-muted ring-1 ring-border";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${style}`}>
      {normalized || "—"}
    </span>
  );
}
