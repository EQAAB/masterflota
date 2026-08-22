import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { exitOrganizationWithCache } from "../../lib/orgContextActions";
import { useRefreshAuthUser } from "../../hooks/useRefreshAuthUser";
import { useOrgStore } from "../../store/orgStore";
import { btnSecondary } from "../../theme/classNames";
import { Sidebar } from "./Sidebar";

const SIDEBAR_KEY = "fm.sidebarCollapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

function OrgContextBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeOrgId = useOrgStore((s) => s.activeOrgId);
  const activeOrgName = useOrgStore((s) => s.activeOrgName);

  if (!activeOrgId) return null;

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-brand-mint/40 px-4 py-2.5">
      <p className="text-sm text-ink">
        {t("layout.viewingOrganization")}{" "}
        <span className="font-semibold">{activeOrgName ?? activeOrgId}</span>
      </p>
      <button
        type="button"
        className={btnSecondary}
        onClick={() => {
          exitOrganizationWithCache(queryClient);
          navigate("/platform");
        }}
      >
        {t("layout.exitOrganization")}
      </button>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readCollapsed);
  useRefreshAuthUser();

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-elevated">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <OrgContextBanner />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">{children}</main>
      </div>
    </div>
  );
}
