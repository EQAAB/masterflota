import { useTranslation } from "react-i18next";
import { driversFilterCard, input, sectionLabel } from "../../../theme/classNames";

type EarningsOverviewFiltersProps = {
  platform: string;
  onPlatformChange: (value: string) => void;
  statusFilter: "all" | "ok" | "broken";
  onStatusChange: (value: "all" | "ok" | "broken") => void;
  platforms: string[];
  visible: boolean;
};

export function EarningsOverviewFilters({
  platform,
  onPlatformChange,
  statusFilter,
  onStatusChange,
  platforms,
  visible,
}: EarningsOverviewFiltersProps) {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <div className={driversFilterCard}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label>
          <span className={sectionLabel}>{t("pages.earningsOverview.platformLabel")}</span>
          <select value={platform} onChange={(e) => onPlatformChange(e.target.value)} className={input}>
            <option value="all">{t("pages.earningsOverview.allPlatforms")}</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={sectionLabel}>{t("pages.earningsOverview.integrityStatusLabel")}</span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as "all" | "ok" | "broken")}
            className={input}
          >
            <option value="all">{t("pages.earningsOverview.allStatuses")}</option>
            <option value="ok">{t("pages.earningsOverview.integrityOk")}</option>
            <option value="broken">{t("pages.earningsOverview.integrityBroken")}</option>
          </select>
        </label>
      </div>
    </div>
  );
}
