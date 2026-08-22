import { useTranslation } from "react-i18next";
import { setAppLanguage, type AppLanguage } from "../../i18n";

type LanguageSwitcherProps = {
  className?: string;
  /** compact = select only; full = label + select */
  variant?: "compact" | "full";
};

export function LanguageSwitcher({ className = "", variant = "full" }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const value: AppLanguage = i18n.language?.startsWith("ro") ? "ro" : "en";

  return (
    <label className={`flex items-center gap-2 ${className}`}>
      {variant === "full" && (
        <span className="text-sm font-medium text-ink-muted whitespace-nowrap">{t("common.language")}</span>
      )}
      <select
        className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        value={value}
        aria-label={t("common.language")}
        onChange={(e) => {
          const next = e.target.value as AppLanguage;
          void setAppLanguage(next);
        }}
      >
        <option value="en">{t("common.english")}</option>
        <option value="ro">{t("common.romanian")}</option>
      </select>
    </label>
  );
}
