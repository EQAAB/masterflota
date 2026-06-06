import { create } from "zustand";
import { useOrgStore } from "./orgStore";

export interface AuthUser {
  id: string;
  organizationId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  roleId: string;
  role: string;
  permissions: string[];
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  updateUser: (user: AuthUser) => void;
  clearAuth: () => void;
  logout: () => void;
}

const TOKEN_KEY = "fleet_auth_token";
const USER_KEY = "fleet_auth_user";

function normalizeUser(raw: AuthUser): AuthUser {
  return {
    ...raw,
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
    roleId: raw.roleId ?? "",
    role: raw.role ?? "viewer",
  };
}

const persistedToken = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
const persistedUser =
  typeof window !== "undefined" && localStorage.getItem(USER_KEY)
    ? normalizeUser(JSON.parse(localStorage.getItem(USER_KEY) as string) as AuthUser)
    : null;

export const useAuthStore = create<AuthState>((set) => ({
  token: persistedToken,
  user: persistedUser,
  setAuth: (token, user) => {
    const normalized = normalizeUser(user);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
    set({ token, user: normalized });
  },
  updateUser: (user) => {
    const normalized = normalizeUser(user);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
    set({ user: normalized });
  },
  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    useOrgStore.getState().clearOrgContext();
    set({ token: null, user: null });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    useOrgStore.getState().clearOrgContext();
    set({ token: null, user: null });
    if (typeof window !== "undefined") {
      window.location.href = "login";
    }
  },
}));
