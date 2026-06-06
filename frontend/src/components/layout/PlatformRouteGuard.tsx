import { Navigate } from "react-router-dom";
import { isPlatformMode, isPlatformSuperAdmin } from "../../lib/platform";
import { useAuthStore } from "../../store/authStore";
import { useOrgStore } from "../../store/orgStore";

export function FleetRouteGuard({ children }: { children: React.ReactElement }) {
  const user = useAuthStore((s) => s.user);
  const activeOrgId = useOrgStore((s) => s.activeOrgId);

  if (isPlatformMode(user, activeOrgId)) {
    return <Navigate to="/platform" replace />;
  }

  return children;
}

export function PlatformRouteGuard({ children }: { children: React.ReactElement }) {
  const user = useAuthStore((s) => s.user);
  const activeOrgId = useOrgStore((s) => s.activeOrgId);

  if (!isPlatformSuperAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }
  if (activeOrgId) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function DefaultAppRedirect() {
  const user = useAuthStore((s) => s.user);
  const activeOrgId = useOrgStore((s) => s.activeOrgId);

  if (isPlatformMode(user, activeOrgId)) {
    return <Navigate to="/platform" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
