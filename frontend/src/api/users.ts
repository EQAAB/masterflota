import { api } from "../lib/api";

export type OrgUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roleId: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export function fetchOrgUsers() {
  return api.get<OrgUser[]>("/users");
}

export function createOrgUser(body: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
}) {
  return api.post<{ id: string; temporaryPassword?: string }>("/users", body);
}

export function updateOrgUser(
  id: string,
  body: Partial<{
    roleId: string;
    isActive: boolean;
    firstName: string;
    lastName: string;
    phone: string | null;
  }>,
) {
  return api.patch<{ ok: boolean }>(`/users/${id}`, body);
}

export function deactivateOrgUser(id: string) {
  return api.delete(`/users/${id}`);
}
