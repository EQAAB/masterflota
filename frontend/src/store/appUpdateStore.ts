import { create } from "zustand";
import { evaluateAppVersion, setStoredAppVersion } from "../lib/appVersion";

interface AppUpdateState {
  updateAvailable: boolean;
  acknowledgeServerVersion: (version: string) => void;
  clearUpdateAvailable: () => void;
}

export const useAppUpdateStore = create<AppUpdateState>((set) => ({
  updateAvailable: false,
  acknowledgeServerVersion: (version) => {
    const mismatch = evaluateAppVersion(version);
    if (mismatch) {
      set({ updateAvailable: true });
      return;
    }
    setStoredAppVersion(version);
    set({ updateAvailable: false });
  },
  clearUpdateAvailable: () => set({ updateAvailable: false }),
}));

export function acknowledgeServerVersion(version: string) {
  useAppUpdateStore.getState().acknowledgeServerVersion(version);
}
