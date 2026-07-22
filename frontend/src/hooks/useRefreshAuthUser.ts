import { useEffect } from "react";
import { fetchMe } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { useOrgStore } from "../store/orgStore";

/** Refreshes permissions and profile from the server when auth or org context changes. */
export function useRefreshAuthUser() {
  const token = useAuthStore((s) => s.token);
  const activeOrgId = useOrgStore((s) => s.activeOrgId);
  const updateUser = useAuthStore((s) => s.updateUser);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void fetchMe()
      .then((res) => {
        if (!cancelled) updateUser(res.data.user);
      })
      .catch(() => {
        /* 401 handled by api interceptor; ignore transient errors */
      });
    return () => {
      cancelled = true;
    };
  }, [token, activeOrgId, updateUser]);
}
