import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json" with { type: "json" };
import ro from "./locales/ro.json" with { type: "json" };

export const LANGUAGE_STORAGE_KEY = "fm.language";
export type AppLanguage = "en" | "ro";

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === "en" || value === "ro";
}

export function getStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isAppLanguage(stored)) return stored;
  } catch {
    /* ignore */
  }
  const browser = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "";
  if (browser.startsWith("ro")) return "ro";
  return "en";
}

export function applyDocumentLanguage(lng: AppLanguage): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lng === "ro" ? "ro" : "en";
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ro: { translation: ro },
  },
  lng: getStoredLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
});

applyDocumentLanguage(getStoredLanguage());

i18n.on("languageChanged", (lng) => {
  if (isAppLanguage(lng)) applyDocumentLanguage(lng);
});

export async function setAppLanguage(lng: AppLanguage): Promise<void> {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
  applyDocumentLanguage(lng);
  await i18n.changeLanguage(lng);
}

export default i18n;
