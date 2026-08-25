import { useTranslation } from "react-i18next";

export function UsersTeamAccessOverview() {
  const { t } = useTranslation();
  const PERMISSION_CHIPS = [
    t("pages.users.chipFleetOperations"),
    t("pages.users.chipEarningsAccess"),
    t("pages.users.chipSettingsAccess"),
  ];

  return (
    <section className="fm-settings-users__access-card">
      <h2 className="text-sm font-semibold text-ink">{t("pages.users.teamAccessOverviewTitle")}</h2>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">
        {t("pages.users.teamAccessOverviewDesc")}
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
