import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { usePermission } from "../../lib/permissions";
import { getSubcontractors } from "../../api/subcontractors";
import { SubcontractorsList } from "../../components/subcontractors/SubcontractorsList";

export function SubcontractorsListPage() {
  const { t } = useTranslation();
  const canAccess = usePermission("subcontractors.view");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => getSubcontractors().then((r) => r.data),
    enabled: canAccess,
  });

  if (!canAccess) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-surface-elevated p-6">
        <p className="text-ink-muted">{t("pages.subcontractorsList.noAccess")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated">
      <SubcontractorsList subcontractors={data} isLoading={isLoading} isError={isError} />
    </div>
  );
}
