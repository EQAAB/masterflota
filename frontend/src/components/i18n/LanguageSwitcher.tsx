import { useTranslation } from "react-i18next";
import { setAppLanguage, type AppLanguage } from "../../i18n";

type LanguageSwitcherProps = {
  className?: string;
  /** compact = toggle only; full = label + toggle */
  variant?: "compact" | "full";
  /** visual theme to match the surrounding surface */
  tone?: "light" | "dark";
};

const LANGUAGES: { code: AppLanguage; short: string }[] = [
  { code: "en", short: "EN" },
  { code: "ro", short: "RO" },
];

export function LanguageSwitcher({ className = "", variant = "full", tone = "light" }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const value: AppLanguage = i18n.language?.startsWith("ro") ? "ro" : "en";

  const trackClass = tone === "dark" ? "border-white/20 bg-white/10" : "border-border bg-surface-elevated";
  const inactiveClass = tone === "dark" ? "text-white/60 hover:text-white" : "text-ink-muted hover:text-ink";
  const activeClass = tone === "dark" ? "bg-white text-ink shadow-sm" : "bg-brand text-white shadow-sm";
  const labelClass = tone === "dark" ? "text-white/70" : "text-ink-muted";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {variant === "full" && (
        <span className={`text-sm font-medium whitespace-nowrap ${labelClass}`}>{t("common.language")}</span>
      )}
      <div
        role="radiogroup"
        aria-label={t("common.language")}
        className={`inline-flex rounded-full border p-0.5 text-xs font-semibold ${trackClass}`}
      >
        {LANGUAGES.map(({ code, short }) => {
          const active = value === code;
          return (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={code === "en" ? t("common.english") : t("common.romanian")}
              onClick={() => void setAppLanguage(code)}
              className={`rounded-full px-3 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                active ? activeClass : inactiveClass
              }`}
            >
              {short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
