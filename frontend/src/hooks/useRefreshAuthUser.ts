import { useEffect } from "react";
import { fetchMe } from "../api/auth";
import { useAuthStore } from "../store/authStore";

/** Refreshes permissions and profile from the server once per authenticated session. */
export function useRefreshAuthUser() {
  const token = useAuthStore((s) => s.token);
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
  }, [token, updateUser]);
}
