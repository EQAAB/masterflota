import type { QueryClient } from "@tanstack/react-query";
import { useOrgStore } from "../store/orgStore";

/** Invalidate org-scoped React Query caches after switching organization context. */
export function invalidateOrgScopedQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries();
}

export function enterOrganizationWithCache(
  queryClient: QueryClient,
  id: string,
  name: string,
) {
  useOrgStore.getState().enterOrganization(id, name);
  invalidateOrgScopedQueries(queryClient);
}

export function exitOrganizationWithCache(queryClient: QueryClient) {
  useOrgStore.getState().exitOrganization();
  queryClient.clear();
}
