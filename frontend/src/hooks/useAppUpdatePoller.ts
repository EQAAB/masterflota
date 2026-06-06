import { useEffect } from "react";
import { fetchAppHealth } from "../api/health";
import { extractVersionFromResponse } from "../lib/appVersion";
import { acknowledgeServerVersion } from "../store/appUpdateStore";

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export function useAppUpdatePoller() {
  useEffect(() => {
    const check = () => {
      void fetchAppHealth()
        .then((res) => {
          const version = res.data.version ?? extractVersionFromResponse(res);
          if (version) acknowledgeServerVersion(version);
        })
        .catch(() => {
          /* ignore transient health failures */
        });
    };

    check();
    const id = window.setInterval(check, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);
}
