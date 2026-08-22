import { useTranslation } from "react-i18next";

export function RoutePageFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[40vh] flex-1 items-center justify-center p-8">
      <p className="text-sm text-ink-muted">{t("common.loading")}</p>
    </div>
  );
}
