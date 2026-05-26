import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { btnPrimary, btnSecondary } from "../../theme/classNames";
import { PageHeader } from "../theme/PageHeader";
import { ExportIcon } from "../theme/actionMenuIcons";

function roleLabel(role: string | undefined): string {
  if (role === "admin") return "Administrator";
  if (role === "accountant") return "Accountant";
  if (role === "driver") return "Driver";
  return "Team member";
}

function initials(firstName?: string, lastName?: string): string {
  const a = firstName?.[0] ?? "";
  const b = lastName?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

type VehiclesPageHeaderProps = {
  onExport: () => void;
  exportDisabled?: boolean;
};

export function VehiclesPageHeader({ onExport, exportDisabled }: VehiclesPageHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="shrink-0 border-b border-border/60 bg-surface-card/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Vehicles"
          description="Manage fleet vehicles, assignments, and availability."
          breadcrumbs={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Vehicles" },
          ]}
          className="border-0 bg-transparent px-0 py-4 sm:py-[1.125rem]"
          actions={
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onExport}
                disabled={exportDisabled}
                className={`${btnSecondary} gap-2 text-sm`}
              >
                <ExportIcon className="h-4 w-4" />
                Export
              </button>
              <Link to="/vehicles/new" className={`${btnPrimary} text-sm`}>
                Add Vehicle
              </Link>
              <button
                type="button"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-ink-muted shadow-sm transition-all duration-200 ease-out hover:bg-surface hover:text-ink"
                aria-label="Notifications"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex h-9 items-center gap-2 rounded-xl border border-border bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition-all duration-200 ease-out hover:shadow-card"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-xs font-semibold text-white">
                    {initials(user?.firstName, user?.lastName)}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-sm font-medium text-ink sm:inline">
                    {user?.firstName ?? "Account"}
                  </span>
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-white p-2 shadow-card-hover"
                    role="menu"
                  >
                    <div className="mb-2 border-b border-border px-3 pb-2">
                      <p className="truncate text-sm font-semibold text-ink">
                        {user ? `${user.firstName} ${user.lastName}` : "User"}
                      </p>
                      <p className="truncate text-xs text-ink-muted">{user?.email}</p>
                      <p className="mt-0.5 text-xs text-brand">{roleLabel(user?.role)}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/5"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
