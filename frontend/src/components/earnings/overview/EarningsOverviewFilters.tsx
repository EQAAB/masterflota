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
  if (!visible) return null;

  return (
    <div className={driversFilterCard}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label>
          <span className={sectionLabel}>Platform</span>
          <select value={platform} onChange={(e) => onPlatformChange(e.target.value)} className={input}>
            <option value="all">All platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={sectionLabel}>Integrity status</span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as "all" | "ok" | "broken")}
            className={input}
          >
            <option value="all">All statuses</option>
            <option value="ok">OK</option>
            <option value="broken">Broken</option>
          </select>
        </label>
      </div>
    </div>
  );
}
