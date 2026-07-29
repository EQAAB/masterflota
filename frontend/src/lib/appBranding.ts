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

/** Inline favicon matching FleetManagerLogoMark, so the browser tab icon follows the active brand. */
function buildFaviconDataUri(monogram: string): string {
  const letters = monogram.slice(0, 3).toUpperCase();
  const fontSize = letters.length > 2 ? 9 : 11;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">` +
    `<rect width="32" height="32" rx="8" fill="#003D38"/>` +
    `<rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7.25" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>` +
    `<text x="16" y="21" text-anchor="middle" fill="#FFFFFF" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="${fontSize}" font-weight="700">${letters}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function setLinkTag(rel: string, href: string): void {
  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = href;
}

function setMetaTag(attr: "name" | "property", key: string, content: string): void {
  let meta = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

export function applyDocumentBranding(): void {
  if (typeof document === "undefined") return;
  const branding = getAppBranding();
  const description = `${branding.appName} — fleet and rental management platform.`;

  document.title = branding.appName;
  setLinkTag("icon", buildFaviconDataUri(branding.logoMonogram));
  setMetaTag("name", "description", description);
  setMetaTag("name", "apple-mobile-web-app-title", branding.appName);
  setMetaTag("property", "og:title", branding.appName);
  setMetaTag("property", "og:description", description);
}
