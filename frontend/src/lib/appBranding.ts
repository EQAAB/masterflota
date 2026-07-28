export type AppBranding = {
  appName: string;
  logoMonogram: string;
  marketingUrl: string | null;
  companyName: string | null;
  companyUrl: string | null;
};

function readEnv(key: string): string | undefined {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function defaultMonogram(appName: string): string {
  if (/masterflota/i.test(appName)) return "MF";
  const words = appName.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0]![0]! + words[1]![0]!).toUpperCase();
  }
  return appName.slice(0, 2).toUpperCase() || "FM";
}

let cached: AppBranding | null = null;

export function getAppBranding(): AppBranding {
  if (cached) return cached;

  const appName = readEnv("VITE_APP_NAME") ?? "Fleet Manager";
  const logoMonogram = (readEnv("VITE_APP_LOGO_MONOGRAM") ?? defaultMonogram(appName)).slice(0, 3).toUpperCase();

  cached = {
    appName,
    logoMonogram,
    marketingUrl: readEnv("VITE_MARKETING_URL") ?? null,
    companyName: readEnv("VITE_COMPANY_NAME") ?? null,
    companyUrl: readEnv("VITE_COMPANY_URL") ?? null,
  };
  return cached;
}

export function applyDocumentBranding(): void {
  if (typeof document === "undefined") return;
  document.title = getAppBranding().appName;
}
