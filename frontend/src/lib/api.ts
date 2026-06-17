import axios from "axios";
import { extractVersionFromResponse } from "./appVersion";
import { acknowledgeServerVersion } from "../store/appUpdateStore";
import { useAuthStore } from "../store/authStore";
import { useOrgStore } from "../store/orgStore";

export const apiBaseURL =
  import.meta.env.VITE_API_URL ?? "http://103.131.215.13:4100/api";

export const api = axios.create({
  baseURL: apiBaseURL,
});

function isPlatformRoute(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.startsWith("http") ? new URL(url).pathname : url;
  return path.includes("/auth") || path.includes("/organizations");
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const activeOrgId = useOrgStore.getState().activeOrgId;
  if (activeOrgId && !isPlatformRoute(config.url)) {
    config.headers.set("X-Organization-Id", activeOrgId);
  }

  return config;
});

function isLoginRequest(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.startsWith("http") ? new URL(url).pathname : url;
  return path.includes("/auth/login");
}

function redirectToLoginIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname.endsWith("/login")) return;
  window.location.href = "login";
}

api.interceptors.response.use(
  (response) => {
    const version = extractVersionFromResponse(response);
    if (version) acknowledgeServerVersion(version);
    return response;
  },
  (error) => {
    const version = extractVersionFromResponse(error.response);
    if (version) acknowledgeServerVersion(version);

    if (error.response?.status === 401 && !isLoginRequest(error.config?.url)) {
      useAuthStore.getState().clearAuth();
      redirectToLoginIfNeeded();
    }

    return Promise.reject(error);
  },
);

