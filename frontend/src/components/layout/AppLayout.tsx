import { useEffect, useState } from "react";
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readCollapsed);

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
      <main className="flex min-w-0 flex-1 flex-col overflow-auto">{children}</main>
    </div>
  );
}
