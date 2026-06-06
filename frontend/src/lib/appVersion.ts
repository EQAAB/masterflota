import type { AxiosResponse } from "axios";

export const APP_VERSION_STORAGE_KEY = "fleet_app_version";

export function getStoredAppVersion(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(APP_VERSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredAppVersion(version: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(APP_VERSION_STORAGE_KEY, version);
  } catch {
    /* ignore */
  }
}

export function extractVersionFromResponse(
  response: AxiosResponse | undefined,
): string | null {
  if (!response?.headers) return null;
  const raw = response.headers["x-app-version"];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return value || null;
}

/** Returns true when the server version differs from the stored baseline. */
export function evaluateAppVersion(serverVersion: string | null): boolean {
  if (!serverVersion) return false;
  const stored = getStoredAppVersion();
  if (!stored) {
    setStoredAppVersion(serverVersion);
    return false;
  }
  return stored !== serverVersion;
}
