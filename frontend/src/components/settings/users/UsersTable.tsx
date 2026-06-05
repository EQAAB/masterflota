import { useCallback, useMemo, useState } from "react";
import type { OrgUser } from "../../../api/users";
import type { RoleItem } from "../../../api/roles";
import { ActionMenuDropdown } from "../../theme/ActionMenuDropdown";
import { buildUserActionMenuItems } from "./buildUserActionMenuItems";
import { UserTableRow } from "./UserTableRow";
import { UsersPaginationFooter } from "./UsersPaginationFooter";

type UsersTableProps = {
  users: OrgUser[];
  totalFiltered: number;
  allUsersCount: number;
  roles: RoleItem[];
  loading?: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRoleChange: (id: string, roleId: string) => void;
  onEdit: (user: OrgUser) => void;
  onDeactivate: (id: string) => void;
  onActivate: (id: string) => void;
  isUpdating: boolean;
  hasActiveFilters: boolean;
};

export function UsersTable({
  users,
  totalFiltered,
  allUsersCount,
  roles,
  loading,
  page,
  pageSize,
  onPageChange,
  onRoleChange,
  onEdit,
  onDeactivate,
  onActivate,
  isUpdating,
  hasActiveFilters,
}: UsersTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
    setMenuAnchor(null);
  }, []);

  const handleActionMenuToggle = useCallback(
    (userId: string, el: HTMLElement) => {
      if (openMenuId === userId) {
        closeMenu();
        return;
      }
      setOpenMenuId(userId);
      setMenuAnchor(el);
    },
    [openMenuId, closeMenu],
  );

  const openUser = users.find((u) => u.id === openMenuId);

  const confirmDeactivate = useCallback(
    (user: OrgUser) => {
      if (!window.confirm(`Deactivate ${user.firstName} ${user.lastName}? They will no longer be able to sign in.`)) {
        return;
      }
      closeMenu();
      onDeactivate(user.id);
    },
    [closeMenu, onDeactivate],
  );

  const confirmActivate = useCallback(
    (user: OrgUser) => {
      closeMenu();
      onActivate(user.id);
    },
    [closeMenu, onActivate],
  );

  const menuItems = useMemo(() => {
    if (!openUser) return [];
    return buildUserActionMenuItems({
      user: openUser,
      onEdit: () => {
        closeMenu();
        onEdit(openUser);
      },
      onDeactivate: () => confirmDeactivate(openUser),
      onActivate: () => confirmActivate(openUser),
    });
  }, [openUser, closeMenu, onEdit, confirmDeactivate, confirmActivate]);

  if (loading) {
    return (
      <div className="fm-settings-users__table-shell">
        <div className="space-y-3 p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="fm-settings-users__skeleton h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="fm-settings-users__table-shell">
        <div className="fm-settings-users__empty">
          <p className="text-sm font-medium text-ink">
            {allUsersCount === 0 ? "No users yet" : "No users found"}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {allUsersCount === 0
              ? "Add your first team member to get started."
              : hasActiveFilters
                ? "Try adjusting your search or filters."
                : "There are no users to display."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fm-settings-users__table-shell">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/90 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserTableRow
                  key={u.id}
                  user={u}
                  roles={roles}
                  onRoleChange={onRoleChange}
                  onEdit={onEdit}
                  onDeactivate={confirmDeactivate}
                  onActivate={confirmActivate}
                  onActionMenuToggle={handleActionMenuToggle}
                  isMenuOpen={openMenuId === u.id}
                  isUpdating={isUpdating}
                />
              ))}
            </tbody>
          </table>
        </div>

        <UsersPaginationFooter
          page={page}
          pageSize={pageSize}
          total={totalFiltered}
          onPageChange={onPageChange}
        />
      </div>

      <ActionMenuDropdown
        open={!!openMenuId && !!menuAnchor}
        anchorEl={menuAnchor}
        items={menuItems}
        align="right"
        onClose={closeMenu}
      />
    </>
  );
}
