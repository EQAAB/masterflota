import { api } from "../lib/api";
import type { AuthUser } from "../store/authStore";

export interface MeResponse {
  user: AuthUser;
}

export function fetchMe() {
  return api.get<MeResponse>("/auth/me");
}

export function changePassword(currentPassword: string, newPassword: string) {
  return api.post<{ message: string }>("/auth/change-password", {
    currentPassword,
    newPassword,
  });
}
