import { api } from "../lib/api";

export type RoleItem = {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  isDefault: boolean;
  permissions: string[];
};

export type PermissionItem = {
  id: string;
  name: string;
  module: string;
  description: string | null;
};

export function fetchRoles() {
  return api.get<RoleItem[]>("/roles");
}

export function fetchPermissions() {
  return api.get<PermissionItem[]>("/roles/permissions");
}

export function fetchRole(id: string) {
  return api.get<RoleItem>(`/roles/${id}`);
}

export function createRole(body: {
  name: string;
  description?: string;
  permissionNames?: string[];
}) {
  return api.post<RoleItem>("/roles", body);
}

export function updateRole(id: string, body: { name?: string; description?: string }) {
  return api.patch<RoleItem>(`/roles/${id}`, body);
}

export function deleteRole(id: string) {
  return api.delete(`/roles/${id}`);
}

export function updateRolePermissions(id: string, permissionNames: string[]) {
  return api.patch<{ ok: boolean; permissions: string[] }>(`/roles/${id}/permissions`, { permissionNames });
}
