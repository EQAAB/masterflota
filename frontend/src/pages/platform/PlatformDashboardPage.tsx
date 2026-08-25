import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchOrganizations } from "../../api/organizations";
import { usePermission } from "../../lib/permissions";
import { btnPrimary, btnSecondary, card, dashboardPage } from "../../theme/classNames";

export function PlatformDashboardPage() {
  const { t } = useTranslation();
  const canManageOrgs = usePermission("organizations.create");

  const orgsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => fetchOrganizations().then((r) => r.data),
    enabled: canManageOrgs,
  });

  const orgs = orgsQuery.data ?? [];
  const recentOrgs = orgs.slice(0, 5);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated">
      <div className={`${dashboardPage} space-y-6`}>
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{t("pages.platformDashboard.title")}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t("pages.platformDashboard.subtitle")}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className={`${card} p-5 shadow-card`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {t("pages.organizations.title")}
            </p>
            <p className="mt-2 text-3xl font-bold text-ink">
              {orgsQuery.isLoading ? "—" : orgs.length}
            </p>
          </div>
        </div>

        <div className={`${card} p-5 shadow-card`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">{t("pages.organizations.title")}</h2>
              <p className="mt-1 text-xs text-ink-muted">
                {t("pages.platformDashboard.selectOrgDesc")}
              </p>
            </div>
            {canManageOrgs && (
              <Link to="/settings/organizations" className={btnPrimary}>
                {t("pages.platformDashboard.manageOrganizations")}
              </Link>
            )}
          </div>

          {orgsQuery.isLoading ? (
            <p className="mt-4 text-sm text-ink-muted">{t("pages.organizations.loadingOrganizations")}</p>
          ) : recentOrgs.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">{t("pages.organizations.noOrganizationsYet")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {recentOrgs.map((org) => (
                <li
                  key={org.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-ink">{org.name}</p>
                    <p className="text-xs text-ink-muted">{org.email ?? t("pages.platformDashboard.noEmailFallback")}</p>
                  </div>
                  <Link to="/settings/organizations" className={btnSecondary}>
                    {t("common.view")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
