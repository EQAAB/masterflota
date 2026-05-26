import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { sidebarNavActive, sidebarNavInactive, sidebarNavItem } from "../../theme/classNames";
import { LogoutButton } from "../UI/LogoutButton";
import { FleetManagerLogoMark } from "../brand/FleetManagerLogoMark";

const earningsSubItems = [
  { to: "/earnings", label: "Overview" },
  { to: "/earnings/import", label: "Import" },
  { to: "/earnings/payouts", label: "Payouts" },
  { to: "/earnings/reports", label: "Reports" },
  { to: "/earnings/subcontractors/settlements", label: "Sub settlements" },
];

const ICON = "w-5 h-5 shrink-0 stroke-[1.75]";

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function DriversIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function VehiclesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M6 11l1.5-4.5A2 2 0 019.4 6h5.2a2 2 0 011.9 1.3L18 11M6 11h12v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6z" />
      <circle cx="8.5" cy="17.5" r="1.5" />
      <circle cx="15.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function SubcontractorsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function EarningsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function LogoMark() {
  return <FleetManagerLogoMark className="h-9 w-9" />;
}

function SidebarNavItem({
  to,
  label,
  icon: Icon,
  collapsed,
  isActive,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  isActive: boolean;
}) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={`${sidebarNavItem} ${isActive ? sidebarNavActive : sidebarNavInactive} ${
        collapsed ? "justify-center px-2" : ""
      }`}
    >
      <Icon className={ICON} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function EarningsFlyout({
  anchorRect,
  onClose,
}: {
  anchorRect: DOMRect;
  onClose: () => void;
}) {
  const location = useLocation();
  return createPortal(
    <div className="fixed inset-0 z-[100]" onClick={onClose} role="presentation">
      <div
        className="absolute z-[101] min-w-[200px] rounded-xl border border-white/20 bg-brand-deeper/95 p-2 shadow-sidebar-glow backdrop-blur-md"
        style={{ left: anchorRect.right + 8, top: anchorRect.top }}
        onClick={(e) => e.stopPropagation()}
        role="menu"
      >
        <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/50">Earnings</p>
        {earningsSubItems.map(({ to, label }) => {
          const active =
            to === "/earnings"
              ? location.pathname === "/earnings"
              : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              role="menuitem"
              onClick={onClose}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                active ? "bg-brand-mint font-medium text-ink" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const role = useAuthStore((s) => s.user?.role);
  const showEarnings = role === "admin" || role === "accountant";
  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
    { to: "/drivers", label: "Drivers", icon: DriversIcon },
    { to: "/vehicles", label: "Vehicles", icon: VehiclesIcon },
    ...(showEarnings ? [{ to: "/subcontractors", label: "Subcontractors", icon: SubcontractorsIcon }] : []),
  ];
  const [earningsOpen, setEarningsOpen] = useState(() => location.pathname.startsWith("/earnings"));
  const [earningsFlyout, setEarningsFlyout] = useState(false);
  const earningsBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (location.pathname.startsWith("/earnings")) setEarningsOpen(true);
  }, [location.pathname]);

  const earningsActive = location.pathname.startsWith("/earnings");

  return (
    <aside
      className={`sidebar-shell sidebar-noise relative ${collapsed ? "w-[64px]" : "w-[240px]"}`}
    >
      <div className="relative z-10 flex h-14 shrink-0 items-center border-b border-white/10 px-3">
        {!collapsed && (
          <Link to="/dashboard" className="flex min-w-0 flex-1 items-center gap-2.5">
            <LogoMark />
            <span className="truncate font-semibold text-white">Fleet Manager</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/dashboard" className="mx-auto" title="Fleet Manager">
            <LogoMark />
          </Link>
        )}
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-3 top-[52px] z-20 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-ink-muted shadow-card transition-all hover:text-ink hover:shadow-card-hover"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      <nav className="sidebar-glass-nav relative z-10">
        <div className="relative z-10 space-y-0.5 p-1">
          {navItems.map(({ to, label, icon }) => {
            const isActive =
              location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to));
            return (
              <SidebarNavItem
                key={to}
                to={to}
                label={label}
                icon={icon}
                collapsed={collapsed}
                isActive={isActive}
              />
            );
          })}

          {showEarnings &&
            (collapsed ? (
              <>
                <button
                  ref={earningsBtnRef}
                  type="button"
                  title="Earnings"
                  onClick={() => setEarningsFlyout((o) => !o)}
                  className={`${sidebarNavItem} w-full ${earningsActive ? sidebarNavActive : sidebarNavInactive} justify-center px-2`}
                  aria-expanded={earningsFlyout}
                  aria-haspopup="menu"
                >
                  <EarningsIcon className={ICON} />
                </button>
                {earningsFlyout && earningsBtnRef.current && (
                  <EarningsFlyout
                    anchorRect={earningsBtnRef.current.getBoundingClientRect()}
                    onClose={() => setEarningsFlyout(false)}
                  />
                )}
              </>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setEarningsOpen((o) => !o)}
                  className={`${sidebarNavItem} w-full text-left ${
                    earningsActive ? sidebarNavActive : sidebarNavInactive
                  }`}
                  aria-expanded={earningsOpen}
                >
                  <EarningsIcon className={ICON} />
                  <span className="flex-1 truncate">Earnings</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${earningsOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {earningsOpen && (
                  <div className="relative z-10 mt-0.5 ml-2 space-y-0.5 border-l border-white/20 pl-3">
                    {earningsSubItems.map(({ to, label }) => {
                      const active =
                        to === "/earnings"
                          ? location.pathname === "/earnings"
                          : location.pathname.startsWith(to);
                      return (
                        <Link
                          key={to}
                          to={to}
                          className={`flex min-h-[36px] items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                            active
                              ? "bg-brand-mint font-medium text-ink"
                              : "text-white/60 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span className="truncate">{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
        </div>
      </nav>

      <div className="relative z-10 shrink-0 space-y-2 border-t border-white/10 p-2">
        {!collapsed && (
          <>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`${sidebarNavItem} ${sidebarNavInactive}`}
            >
              <svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate">Help</span>
            </a>
            <div className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-sm">
              <p className="text-xs font-semibold text-white">Fleet Pro</p>
              <p className="mt-0.5 text-[11px] leading-snug text-white/60">
                Advanced reporting and multi-org support — coming soon.
              </p>
            </div>
          </>
        )}
        <LogoutButton collapsed={collapsed} />
      </div>
    </aside>
  );
}
