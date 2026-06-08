import { Navigate } from "react-router-dom";
import { useCanManageRentals } from "../../lib/rentalsPermissions";

export function RentalsManageRouteGuard({ children }: { children: React.ReactElement }) {
  const canManage = useCanManageRentals();

  if (!canManage) {
    return <Navigate to="/rentals" replace />;
  }

  return children;
}
