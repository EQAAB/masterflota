import { usePermission } from "./permissions";

export function useCanManageRentals(): boolean {
  return usePermission("rentals.manage");
}
