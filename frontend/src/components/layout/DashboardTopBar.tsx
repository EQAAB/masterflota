import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { btnSecondary } from "../../theme/classNames";

type DatePreset = "today" | "week" | "month" | "custom";

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

import { roleLabel } from "../../lib/roleLabel";

function initials(firstName?: string, lastName?: string): string {
  const a = firstName?.[0] ?? "";
  const b = lastName?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export function DashboardTopBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [preset, setPreset] = useState<DatePreset>("week");
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().slice(0, 10));
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

  const subtitle = user
    ? `${roleLabel(user.role)} · Fleet overview`
    : "Fleet overview";

  return (
    <header className="shrink-0 border-b border-border/60 bg-surface-card/90 px-4 py-5 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Welcome{user ? `, ${user.firstName}` : ""}
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/80 bg-surface-elevated p-1"
            role="group"
            aria-label="Date range"
          >
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  preset === p.id
                    ? "bg-brand text-white shadow-soft"
                    : "text-ink-muted hover:bg-white hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            ))}
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setPreset("custom");
              }}
              className="rounded-lg border-0 bg-transparent px-2 py-1.5 text-xs text-ink focus:ring-2 focus:ring-brand/20"
              aria-label="Custom date"
            />
          </div>

          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-ink-muted shadow-sm transition-all hover:bg-surface hover:text-ink"
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
              className="flex items-center gap-2 rounded-xl border border-border bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition-all hover:shadow-card"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-xs font-semibold text-white">
                {initials(user?.firstName, user?.lastName)}
              </span>
              {!menuOpen && (
                <span className="hidden text-sm font-medium text-ink sm:inline max-w-[120px] truncate">
                  {user?.firstName ?? "Account"}
                </span>
              )}
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-white p-2 shadow-card-hover"
                role="menu"
              >
                <div className="border-b border-border px-3 pb-2 mb-2">
                  <p className="text-sm font-semibold text-ink truncate">
                    {user ? `${user.firstName} ${user.lastName}` : "User"}
                  </p>
                  <p className="text-xs text-ink-muted truncate">{user?.email}</p>
                  <p className="text-xs text-brand mt-0.5">{roleLabel(user?.role)}</p>
                </div>
                <Link
                  to="/drivers"
                  className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  View drivers
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

          <Link to="/drivers" className={`${btnSecondary} hidden lg:inline-flex text-sm`}>
            All drivers
          </Link>
        </div>
      </div>
    </header>
  );
}
