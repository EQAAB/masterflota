/**
 * Public URL path prefix for the SPA (Vite `base` and React Router `basename`).
 * Default `/fleet` matches the single-VM Nginx layout; use `/` for app.example.com.
 */
export function normalizeAppBasePath(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed) return "/fleet";
  if (trimmed === "/") return "/";
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.replace(/\/$/, "") || "/";
}

export function appBasePath(): string {
  return normalizeAppBasePath(import.meta.env.VITE_BASE_PATH as string | undefined);
}

/** Vite `base` — trailing slash except when served at domain root. */
export function viteBasePathFrom(raw: string | undefined): string {
  const base = normalizeAppBasePath(raw);
  return base === "/" ? "/" : `${base}/`;
}
