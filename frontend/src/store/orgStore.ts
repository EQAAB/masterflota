import { create } from "zustand";

const ORG_ID_KEY = "fleet_active_org_id";
const ORG_NAME_KEY = "fleet_active_org_name";

function readSession(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value == null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

interface OrgState {
  activeOrgId: string | null;
  activeOrgName: string | null;
  enterOrganization: (id: string, name: string) => void;
  exitOrganization: () => void;
  clearOrgContext: () => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  activeOrgId: readSession(ORG_ID_KEY),
  activeOrgName: readSession(ORG_NAME_KEY),
  enterOrganization: (id, name) => {
    writeSession(ORG_ID_KEY, id);
    writeSession(ORG_NAME_KEY, name);
    set({ activeOrgId: id, activeOrgName: name });
  },
  exitOrganization: () => {
    writeSession(ORG_ID_KEY, null);
    writeSession(ORG_NAME_KEY, null);
    set({ activeOrgId: null, activeOrgName: null });
  },
  clearOrgContext: () => {
    writeSession(ORG_ID_KEY, null);
    writeSession(ORG_NAME_KEY, null);
    set({ activeOrgId: null, activeOrgName: null });
  },
}));
