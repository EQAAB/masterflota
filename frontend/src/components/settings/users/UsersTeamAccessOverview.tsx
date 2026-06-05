const PERMISSION_CHIPS = [
  "Fleet Operations",
  "Earnings Access",
  "Settings Access",
] as const;

export function UsersTeamAccessOverview() {
  return (
    <section className="fm-settings-users__access-card">
      <h2 className="text-sm font-semibold text-ink">Team access overview</h2>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">
        Manage who can access fleet operations, earnings, rentals, and settings.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {PERMISSION_CHIPS.map((chip) => (
          <span key={chip} className="fm-settings-users__access-chip">
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}
