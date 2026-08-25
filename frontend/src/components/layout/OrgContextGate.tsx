import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useOrgStore } from "../../store/orgStore";
import { isPlatformMode } from "../../lib/platform";
import { btnPrimary, card, dashboardPage } from "../../theme/classNames";

type OrgContextGateProps = {
  children: React.ReactNode;
};

export function OrgContextGate({ children }: OrgContextGateProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const activeOrgId = useOrgStore((s) => s.activeOrgId);

  if (isPlatformMode(user, activeOrgId)) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-surface-elevated">
        <div className={`${dashboardPage} flex flex-col items-center justify-center py-16 text-center`}>
          <div className={`${card} max-w-md p-8 shadow-card`}>
            <h2 className="text-lg font-semibold text-ink">{t("pages.organizations.organizationRequiredTitle")}</h2>
            <p className="mt-2 text-sm text-ink-muted">
              {t("pages.organizations.organizationRequiredDesc")}
            </p>
            <Link to="/settings/organizations" className={`${btnPrimary} mt-6 inline-flex`}>
              {t("pages.organizations.goToOrganizationsButton")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
