import { api } from "../lib/api";

export type Organization = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

export type CreateOrganizationBody = {
  name: string;
  email?: string;
  phone?: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName?: string;
  adminLastName?: string;
};

export function fetchOrganizations() {
  return api.get<Organization[]>("/organizations");
}

export function createOrganization(body: CreateOrganizationBody) {
  return api.post<{
    organization: Organization;
    admin: { id: string; email: string; firstName: string; lastName: string };
  }>("/organizations", body);
}
