import { useCallback, useMemo, useState } from "react";
import type { OrgUser } from "../../../api/users";
import type { RoleItem } from "../../../api/roles";
import { ActionMenuDropdown } from "../../theme/ActionMenuDropdown";
import { buildUserActionMenuItems } from "./buildUserActionMenuItems";
import { UserTableRow } from "./UserTableRow";
import { UsersPaginationFooter } from "./UsersPaginationFooter";

const TABLE_HEAD_CLASS =
  "border-b border-slate-200 bg-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600";

const TABLE_WRAPPER_CLASS = "overflow-x-auto lg:overflow-x-visible";
const TABLE_CLASS = "w-full table-fixed text-sm min-w-[640px] lg:min-w-0";
const TH_CLASS = "px-4 py-2";

function UsersTableColGroup() {
  return (
    <colgroup>
      <col className="w-[23%]" />
      <col className="w-[35%]" />
      <col className="w-[16%]" />
      <col className="w-[9%]" />
      <col className="w-[17%]" />
    </colgroup>
  );
}

function UsersTableHead() {
  return (
    <thead>
      <tr className={TABLE_HEAD_CLASS}>
        <th className={TH_CLASS}>Name</th>
        <th className={TH_CLASS}>Email</th>
        <th className={TH_CLASS}>Role</th>
        <th className={TH_CLASS}>Status</th>
        <th className={`${TH_CLASS} fm-settings-users__col-actions text-right`}>Actions</th>
      </tr>
    </thead>
  );
}

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

function EmptyState({ allUsersCount, hasActiveFilters }: { allUsersCount: number; hasActiveFilters: boolean }) {
  const isFiltered = allUsersCount > 0 && hasActiveFilters;
  return (
    <div className="fm-settings-users__empty">
      <svg
        className="mx-auto mb-3 h-10 w-10 text-slate-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      <p className="text-sm font-medium text-ink">
        {allUsersCount === 0 ? "No users yet" : isFiltered ? "No users found" : "No users to display"}
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        {allUsersCount === 0
          ? "Add your first team member to get started."
          : isFiltered
            ? "Try adjusting your search or filters."
            : "There are no users matching the current view."}
      </p>
    </div>
  );
}

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
  const [roleEditUserId, setRoleEditUserId] = useState<string | null>(null);

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
      <div className="fm-settings-users__table-area">
        <div className="fm-settings-users__table-shell">
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="fm-settings-users__skeleton h-16" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="fm-settings-users__table-area">
        <div className="fm-settings-users__table-shell">
          <div className={TABLE_WRAPPER_CLASS}>
            <table className={TABLE_CLASS}>
              <UsersTableColGroup />
              <UsersTableHead />
            </table>
          </div>
          <EmptyState allUsersCount={allUsersCount} hasActiveFilters={hasActiveFilters} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fm-settings-users__table-area">
        <div className="fm-settings-users__table-shell">
          <div className={TABLE_WRAPPER_CLASS}>
            <table className={TABLE_CLASS}>
              <UsersTableColGroup />
              <UsersTableHead />
            <tbody>
              {users.map((u) => (
                <UserTableRow
                  key={u.id}
                  user={u}
                  roles={roles}
                  roleEditing={roleEditUserId === u.id}
                  onRoleEditStart={setRoleEditUserId}
                  onRoleEditEnd={() => setRoleEditUserId(null)}
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
