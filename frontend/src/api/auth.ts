import { api } from "../lib/api";
import type { AuthUser } from "../store/authStore";

export interface MeResponse {
  user: AuthUser;
}

export function fetchMe() {
  return api.get<MeResponse>("/auth/me");
}
