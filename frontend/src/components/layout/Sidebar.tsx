import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useAnyPermission, useCanViewEarningsOverview, useCanViewImports, useCanViewPayouts, usePermission } from "../../lib/permissions";
import { isPlatformMode, isPlatformSuperAdmin } from "../../lib/platform";
import { useAuthStore } from "../../store/authStore";
import { useOrgStore } from "../../store/orgStore";
import { sidebarNavActive, sidebarNavInactive, sidebarNavItem } from "../../theme/classNames";
import { LogoutButton } from "../UI/LogoutButton";
import { FleetManagerLogoMark } from "../brand/FleetManagerLogoMark";
import { getAppBranding } from "../../lib/appBranding";

function buildEarningsSubItems(opts: {
  canViewEarningsOverview: boolean;
  canViewPayouts: boolean;
  canViewImports: boolean;
  canViewDrivers: boolean;
  canViewReports: boolean;
  canSettleSubcontractors: boolean;
}) {
  const items: { to: string; label: string; exact?: boolean }[] = [];
  if (opts.canViewEarningsOverview) {
    items.push({ to: "/earnings", label: "Overview", exact: true });
  }
  if (opts.canViewPayouts) {
    items.push({ to: "/earnings/payouts", label: "Payouts" });
  }
  if (opts.canViewImports) {
    items.push({ to: "/earnings/import", label: "Import" });
  }
  if (opts.canViewDrivers) {
    items.push({ to: "/earnings/loans", label: "Driver loans" });
  }
  if (opts.canViewReports) {
    items.push({ to: "/earnings/reports", label: "Reports" });
  }
  if (opts.canSettleSubcontractors) {
    items.push({ to: "/earnings/subcontractors/settlements", label: "Sub settlements" });
  }
  return items;
}

const rentalSubItems = [
  { to: "/rentals", label: "Dashboard", exact: true },
  { to: "/rentals/bookings", label: "Bookings" },
  { to: "/rentals/calendar", label: "Calendar" },
  { to: "/rentals/customers", label: "Customers" },
  { to: "/rentals/availability", label: "Availability" },
  { to: "/rentals/pricing", label: "Pricing" },
  { to: "/rentals/payments", label: "Payments" },
];

function buildSettingsSubItems(opts: {
  canOrganizations: boolean;
  canUsers: boolean;
  canRoles: boolean;
  canAudit: boolean;
}) {
  const items: { to: string; label: string; exact?: boolean }[] = [];
  if (opts.canOrganizations) items.push({ to: "/settings/organizations", label: "Organizations" });
  if (opts.canUsers) items.push({ to: "/settings/users", label: "Users" });
  if (opts.canRoles) items.push({ to: "/settings/roles", label: "Roles" });
  if (opts.canAudit) items.push({ to: "/settings/audit", label: "Activity log" });
  if (opts.canAudit) items.push({ to: "/settings/login-events", label: "Login activity" });
  return items;
}

const ICON = "w-5 h-5 shrink-0 stroke-[1.75]";
const SIDEBAR_CHEVRON = "h-4 w-4 shrink-0 transition-transform duration-200 ease-out";

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

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function RentalsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
  const branding = getAppBranding();
  return (
    <FleetManagerLogoMark
      className="h-9 w-9"
      title={branding.appName}
      monogram={branding.logoMonogram}
    />
  );
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

function SidebarAccordionPanel({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`sidebar-accordion-panel ${open ? "sidebar-accordion-panel--open" : "sidebar-accordion-panel--closed"}`}
      aria-hidden={!open}
    >
      <div className="sidebar-accordion-panel__inner">{children}</div>
    </div>
  );
}

function NavSubFlyout({
  title,
  items,
  anchorRect,
  onClose,
}: {
  title: string;
  items: { to: string; label: string; exact?: boolean }[];
  anchorRect: DOMRect;
  onClose: () => void;
}) {
  const location = useLocation();
  const flyoutTop = Math.max(8, Math.min(anchorRect.top, window.innerHeight - 280));
  return createPortal(
    <div className="sidebar-flyout-backdrop fixed inset-0 z-[100]" onClick={onClose} role="presentation">
      <div
        className="sidebar-flyout absolute z-[101] max-h-[calc(100vh-16px)] min-w-[200px] overflow-y-auto rounded-xl border border-white/20 bg-brand-deeper/95 p-2 shadow-sidebar-glow backdrop-blur-md"
        style={{ left: anchorRect.right + 8, top: flyoutTop }}
        onClick={(e) => e.stopPropagation()}
        role="menu"
      >
        <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/50">{title}</p>
        {items.map(({ to, label, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
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
    document.body,
  );
}

function isEarningsNavActive(pathname: string, to: string, exact?: boolean) {
  return exact ? pathname === to : pathname.startsWith(to);
}

function isRentalNavActive(pathname: string, to: string, exact?: boolean) {
  return exact ? pathname === to : pathname.startsWith(to);
}

function EarningsSubNavLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: { to: string; label: string; exact?: boolean }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="relative z-10 mt-0.5 ml-2 space-y-0.5 border-l border-white/20 pl-3">
      {items.map(({ to, label, exact }) => {
        const active = isEarningsNavActive(pathname, to, exact);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
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
  );
}

function sectionFromPath(pathname: string): "earnings" | "rentals" | "settings" | null {
  if (pathname.startsWith("/earnings")) return "earnings";
  if (pathname.startsWith("/rentals")) return "rentals";
  if (pathname.startsWith("/settings")) return "settings";
  return null;
}

type NavSection = NonNullable<ReturnType<typeof sectionFromPath>>;

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const activeOrgId = useOrgStore((s) => s.activeOrgId);
  const platformMode = isPlatformMode(user, activeOrgId);
  const homePath = platformMode ? "/platform" : "/dashboard";
  const canViewEarningsOverview = useCanViewEarningsOverview();
  const canViewPayouts = useCanViewPayouts();
  const canViewImports = useCanViewImports();
  const canViewSubcontractors = usePermission("subcontractors.view");
  const canViewDrivers = usePermission("drivers.view");
  const canViewVehicles = usePermission("vehicles.view");
  const canViewDashboard = usePermission("dashboard.view");
  const canViewRentals = useAnyPermission("rentals.view", "rentals.manage");
  const canViewReports = usePermission("reports.view");
  const canSettleSubcontractors = usePermission("subcontractors.settle");
  const earningsSubItems = buildEarningsSubItems({
    canViewEarningsOverview,
    canViewPayouts,
    canViewImports,
    canViewDrivers,
    canViewReports,
    canSettleSubcontractors,
  });
  const showEarningsNav = earningsSubItems.length > 0;
  const canManageOrganizations =
    isPlatformSuperAdmin(user) &&
    isPlatformMode(user, activeOrgId) &&
    usePermission("organizations.create");
  const canManageUsers = usePermission("users.manage");
  const canManageRoles = usePermission("roles.manage");
  const settingsSubItems = [
    { to: "/settings/profile", label: "Profile" },
    ...buildSettingsSubItems({
      canOrganizations: canManageOrganizations,
      canUsers: canManageUsers,
      canRoles: canManageRoles,
      canAudit: canManageUsers,
    }),
  ];
  const showSettingsNav = settingsSubItems.length > 0;
  const showFleetNav = !platformMode;

  const navItems = [
    ...(platformMode
      ? [{ to: "/platform", label: "Platform", icon: DashboardIcon }]
      : canViewDashboard
        ? [{ to: "/dashboard", label: "Dashboard", icon: DashboardIcon }]
        : []),
    ...(showFleetNav && canViewDrivers ? [{ to: "/drivers", label: "Drivers", icon: DriversIcon }] : []),
    ...(showFleetNav && canViewVehicles ? [{ to: "/vehicles", label: "Vehicles", icon: VehiclesIcon }] : []),
    ...(showFleetNav && canViewSubcontractors
      ? [{ to: "/subcontractors", label: "Subcontractors", icon: SubcontractorsIcon }]
      : []),
  ];
  const [openSection, setOpenSection] = useState<NavSection | null>(() => sectionFromPath(location.pathname));
  const [openFlyout, setOpenFlyout] = useState<NavSection | null>(null);
  const earningsBtnRef = useRef<HTMLButtonElement>(null);
  const rentalsBtnRef = useRef<HTMLButtonElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  const toggleSection = (section: NavSection) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const toggleFlyout = (section: NavSection) => {
    setOpenFlyout((prev) => (prev === section ? null : section));
  };

  useEffect(() => {
    setOpenSection(sectionFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    if (!collapsed) setOpenFlyout(null);
  }, [collapsed]);

  const earningsActive = location.pathname.startsWith("/earnings");
  const rentalsActive = location.pathname.startsWith("/rentals");
  const settingsActive = location.pathname.startsWith("/settings");
  const platformActive = location.pathname.startsWith("/platform");
  const branding = getAppBranding();

  return (
    <aside
      className={`sidebar-shell sidebar-noise relative ${collapsed ? "w-[64px]" : "w-[240px]"}`}
    >
      <div className="relative z-10 flex h-14 shrink-0 items-center border-b border-white/10 px-3">
        {!collapsed && (
          <Link to={homePath} className="flex min-w-0 flex-1 items-center gap-2.5">
            <LogoMark />
            <span className="truncate font-semibold text-white">{branding.appName}</span>
          </Link>
        )}
        {collapsed && (
          <Link to={homePath} className="mx-auto" title={branding.appName}>
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
              location.pathname === to ||
              (to !== "/dashboard" && to !== "/platform" && location.pathname.startsWith(to)) ||
              (to === "/platform" && platformActive);
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

          {showFleetNav && showEarningsNav &&
            (collapsed ? (
              <>
                <button
                  ref={earningsBtnRef}
                  type="button"
                  title="Earnings"
                  onClick={() => toggleFlyout("earnings")}
                  className={`${sidebarNavItem} w-full ${earningsActive ? sidebarNavActive : sidebarNavInactive} justify-center px-2`}
                  aria-expanded={openFlyout === "earnings"}
                  aria-haspopup="menu"
                >
                  <EarningsIcon className={ICON} />
                </button>
                {openFlyout === "earnings" && earningsBtnRef.current && (
                  <NavSubFlyout
                    title="Earnings"
                    items={earningsSubItems}
                    anchorRect={earningsBtnRef.current.getBoundingClientRect()}
                    onClose={() => setOpenFlyout(null)}
                  />
                )}
              </>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection("earnings")}
                  className={`${sidebarNavItem} w-full text-left ${
                    earningsActive ? sidebarNavActive : sidebarNavInactive
                  }`}
                  aria-expanded={openSection === "earnings"}
                >
                  <EarningsIcon className={ICON} />
                  <span className="flex-1 truncate">Earnings</span>
                  <ChevronDown
                    className={`${SIDEBAR_CHEVRON} ${openSection === "earnings" ? "rotate-180" : ""}`}
                  />
                </button>
                <SidebarAccordionPanel open={openSection === "earnings"}>
                  <EarningsSubNavLinks items={earningsSubItems} pathname={location.pathname} />
                </SidebarAccordionPanel>
              </div>
            ))}

          {showFleetNav && canViewRentals &&
            (collapsed ? (
              <>
                <button
                  ref={rentalsBtnRef}
                  type="button"
                  title="Rentals"
                  onClick={() => toggleFlyout("rentals")}
                  className={`${sidebarNavItem} w-full ${rentalsActive ? sidebarNavActive : sidebarNavInactive} justify-center px-2`}
                  aria-expanded={openFlyout === "rentals"}
                  aria-haspopup="menu"
                >
                  <RentalsIcon className={ICON} />
                </button>
                {openFlyout === "rentals" && rentalsBtnRef.current && (
                  <NavSubFlyout
                    title="Rentals"
                    items={rentalSubItems}
                    anchorRect={rentalsBtnRef.current.getBoundingClientRect()}
                    onClose={() => setOpenFlyout(null)}
                  />
                )}
              </>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection("rentals")}
                  className={`${sidebarNavItem} w-full text-left ${
                    rentalsActive ? sidebarNavActive : sidebarNavInactive
                  }`}
                  aria-expanded={openSection === "rentals"}
                >
                  <RentalsIcon className={ICON} />
                  <span className="flex-1 truncate">Rentals</span>
                  <ChevronDown
                    className={`${SIDEBAR_CHEVRON} ${openSection === "rentals" ? "rotate-180" : ""}`}
                  />
                </button>
                <SidebarAccordionPanel open={openSection === "rentals"}>
                  <div className="relative z-10 mt-0.5 ml-2 space-y-0.5 border-l border-white/20 pl-3">
                    {rentalSubItems.map(({ to, label, exact }) => {
                      const active = isRentalNavActive(location.pathname, to, exact);
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
                </SidebarAccordionPanel>
              </div>
            ))}

          {showSettingsNav &&
            (collapsed ? (
              <>
                <button
                  ref={settingsBtnRef}
                  type="button"
                  title="Settings"
                  onClick={() => toggleFlyout("settings")}
                  className={`${sidebarNavItem} w-full ${settingsActive ? sidebarNavActive : sidebarNavInactive} justify-center px-2`}
                  aria-expanded={openFlyout === "settings"}
                  aria-haspopup="menu"
                >
                  <SettingsIcon className={ICON} />
                </button>
                {openFlyout === "settings" && settingsBtnRef.current && (
                  <NavSubFlyout
                    title="Settings"
                    items={settingsSubItems}
                    anchorRect={settingsBtnRef.current.getBoundingClientRect()}
                    onClose={() => setOpenFlyout(null)}
                  />
                )}
              </>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection("settings")}
                  className={`${sidebarNavItem} w-full text-left ${
                    settingsActive ? sidebarNavActive : sidebarNavInactive
                  }`}
                  aria-expanded={openSection === "settings"}
                >
                  <SettingsIcon className={ICON} />
                  <span className="flex-1 truncate">Settings</span>
                  <ChevronDown
                    className={`${SIDEBAR_CHEVRON} ${openSection === "settings" ? "rotate-180" : ""}`}
                  />
                </button>
                <SidebarAccordionPanel open={openSection === "settings"}>
                  <div className="relative z-10 mt-0.5 ml-2 space-y-1.5 border-l border-white/20 pl-3">
                    {settingsSubItems.map(({ to, label, exact }) => {
                      const active = exact ? location.pathname === to : location.pathname.startsWith(to);
                      return (
                        <Link
                          key={to}
                          to={to}
                          className={`flex min-h-[36px] items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                            active
                              ? "bg-brand-mint/90 font-medium text-ink ring-1 ring-white/25"
                              : "text-white/75 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span className="truncate">{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </SidebarAccordionPanel>
              </div>
            ))}
        </div>
      </nav>

      <div className="relative z-10 shrink-0 space-y-2 border-t border-white/10 p-2">
        {!collapsed && (
          <>
            {branding.marketingUrl ? (
              <a
                href={branding.marketingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${sidebarNavItem} ${sidebarNavInactive}`}
              >
                <svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <span className="truncate">Product website</span>
              </a>
            ) : null}
            <div className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-sm">
              <p className="text-xs font-semibold text-white">{branding.appName}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-white/60">
                {branding.companyName && branding.companyUrl
                  ? `Built by ${branding.companyName}`
                  : "Fleet operations platform"}
              </p>
              {branding.companyUrl && branding.companyName ? (
                <a
                  href={branding.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-[11px] font-medium text-brand-mint hover:underline"
                >
                  {branding.companyName} →
                </a>
              ) : null}
            </div>
          </>
        )}
        <LogoutButton collapsed={collapsed} />
      </div>
    </aside>
  );
}
