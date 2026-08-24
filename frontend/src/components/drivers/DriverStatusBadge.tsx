import { useTranslation } from "react-i18next";

const EMPLOYMENT_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success",
  suspended: "bg-danger/10 text-danger",
  terminated: "bg-surface text-ink-muted ring-1 ring-border",
};

export function DriverStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const normalized = status?.toLowerCase() ?? "";
  const style = EMPLOYMENT_STYLES[normalized] ?? "bg-surface text-ink-muted ring-1 ring-border";
  const label = normalized && normalized in EMPLOYMENT_STYLES
    ? t(`driverStatus.${normalized}`)
    : normalized || t("common.emDash");

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${style}`}>
      {label}
    </span>
  );
}
