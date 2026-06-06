import { api } from "../lib/api";

export function fetchAppHealth() {
  return api.get<{ status: string; version: string }>("/health");
}
