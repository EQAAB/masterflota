import { getAppBranding } from "../../lib/appBranding";
import { useAppUpdatePoller } from "../../hooks/useAppUpdatePoller";
import { APP_VERSION_STORAGE_KEY } from "../../lib/appVersion";
import { useAppUpdateStore } from "../../store/appUpdateStore";
import { btnPrimary } from "../../theme/classNames";

export function UpdateAvailableBanner() {
  const updateAvailable = useAppUpdateStore((s) => s.updateAvailable);
  const appName = getAppBranding().appName;

  if (!updateAvailable) return null;

  const handleRefresh = () => {
    try {
      localStorage.removeItem(APP_VERSION_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-3 border-b border-brand/20 bg-brand-mint px-4 py-2.5 shadow-sm"
      role="status"
    >
      <p className="text-sm font-medium text-ink">{appName} has been updated.</p>
      <button type="button" className={`${btnPrimary} !min-h-0 px-4 py-1.5 text-xs`} onClick={handleRefresh}>
        Refresh Now
      </button>
    </div>
  );
}

export function AppUpdatePoller() {
  useAppUpdatePoller();
  return null;
}
