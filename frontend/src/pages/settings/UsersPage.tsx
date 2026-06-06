import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAuditLogs } from "../../api/audit";
import { createOrgUser, deactivateOrgUser, fetchOrgUsers, updateOrgUser } from "../../api/users";
import { fetchRoles } from "../../api/roles";
import { UsersAddFormCard, type AddUserForm } from "../../components/settings/users/UsersAddFormCard";
import { UsersEditModal, type EditUserForm } from "../../components/settings/users/UsersEditModal";
import { UsersFilterPanel } from "../../components/settings/users/UsersFilterPanel";
import { UsersKpiRow } from "../../components/settings/users/UsersKpiRow";
import { UsersPageHeader } from "../../components/settings/users/UsersPageHeader";
import { UsersInsightsColumn } from "../../components/settings/users/UsersInsightsColumn";
import { UsersTable } from "../../components/settings/users/UsersTable";
import { UsersTeamAccessOverview } from "../../components/settings/users/UsersTeamAccessOverview";
import {
  USERS_PAGE_SIZE,
  computeUsersKpis,
  filterUsers,
  paginateUsers,
  type UsersFilters,
} from "../../components/settings/users/usersListUtils";
import { TemporaryPasswordAlert } from "../../components/theme/TemporaryPasswordAlert";
import { OrgContextGate } from "../../components/layout/OrgContextGate";
import { useAnyPermission } from "../../lib/permissions";
import { dashboardPage } from "../../theme/classNames";

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

const emptyForm: AddUserForm = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  roleId: "",
};

export function UsersPage() {
  const canManage = useAnyPermission("users.manage");
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<AddUserForm>(emptyForm);
  const [filters, setFilters] = useState<UsersFilters>({ q: "", roleId: "", status: "" });
  const [editingUser, setEditingUser] = useState<EditUserForm | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const debouncedQ = useDebounce(filters.q, 300);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchOrgUsers().then((r) => r.data),
    enabled: canManage,
  });
  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: () => fetchRoles().then((r) => r.data),
    enabled: canManage,
  });

  const activityQuery = useQuery({
    queryKey: ["audit-logs", "users-insights"],
    queryFn: () => fetchAuditLogs({ entityType: "user", limit: 5, page: 1 }).then((r) => r.data),
    enabled: canManage,
  });

  const createMut = useMutation({
    mutationFn: () =>
      createOrgUser({
        ...form,
        password: form.password.trim(),
        roleId: form.roleId || rolesQuery.data?.[0]?.id || "",
      }).then((r) => r.data),
    onSuccess: (data) => {
      setShowForm(false);
      setForm(emptyForm);
      setTemporaryPassword(data.temporaryPassword ?? null);
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<{ roleId: string; firstName: string; lastName: string; isActive: boolean }>;
    }) => updateOrgUser(id, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => deactivateOrgUser(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const allUsers = usersQuery.data ?? [];
  const roles = rolesQuery.data ?? [];

  const effectiveFilters = useMemo(
    () => ({ ...filters, q: debouncedQ }),
    [filters.roleId, filters.status, debouncedQ],
  );

  const filteredUsers = useMemo(
    () => filterUsers(allUsers, effectiveFilters),
    [allUsers, effectiveFilters],
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedUsers = useMemo(
    () => paginateUsers(filteredUsers, safePage, USERS_PAGE_SIZE),
    [filteredUsers, safePage],
  );

  const kpis = useMemo(() => computeUsersKpis(allUsers), [allUsers]);

  const hasActiveFilters =
    debouncedQ.trim() !== "" || filters.roleId !== "" || filters.status !== "";

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, filters.roleId, filters.status]);

  const patchFilters = (patch: Partial<UsersFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  };

  const openEdit = (user: { id: string; firstName: string; lastName: string }) => {
    setEditingUserId(user.id);
    setEditingUser({ firstName: user.firstName, lastName: user.lastName });
  };

  const closeEdit = () => {
    setEditingUserId(null);
    setEditingUser(null);
  };

  const editingUserRecord = editingUserId ? allUsers.find((u) => u.id === editingUserId) ?? null : null;

  if (!canManage) {
    return (
      <div className="fm-settings-users flex min-h-full flex-1 flex-col">
        <div className={dashboardPage}>
          <p className="text-ink-muted">You do not have access to manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <OrgContextGate>
    <div className="fm-settings-users flex min-h-full flex-1 flex-col">
      <div className={`${dashboardPage} fm-settings-users__page`}>
        <UsersPageHeader
          search={filters.q}
          onSearchChange={(q) => patchFilters({ q })}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((v) => !v)}
          hasActiveFilters={hasActiveFilters}
          showForm={showForm}
          onToggleForm={() => setShowForm((v) => !v)}
        />

        <UsersKpiRow kpis={kpis} loading={usersQuery.isLoading} />

        {filtersOpen && (
          <UsersFilterPanel
            filters={filters}
            roles={roles}
            onChange={patchFilters}
            onClear={() => patchFilters({ roleId: "", status: "" })}
          />
        )}

        {temporaryPassword && (
          <TemporaryPasswordAlert
            password={temporaryPassword}
            onDismiss={() => setTemporaryPassword(null)}
          />
        )}

        {showForm && (
          <UsersAddFormCard
            form={form}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            roles={roles}
            onSubmit={() => createMut.mutate()}
            isPending={createMut.isPending}
          />
        )}

        {usersQuery.isError && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Failed to load users. Check your connection and try again.
          </p>
        )}

        <div className="fm-settings-users__main-grid">
          <div className="fm-settings-users__main-column min-w-0 space-y-3">
            <UsersTable
              users={paginatedUsers}
              totalFiltered={filteredUsers.length}
              allUsersCount={allUsers.length}
              roles={roles}
              loading={usersQuery.isLoading}
              page={safePage}
              pageSize={USERS_PAGE_SIZE}
              onPageChange={setPage}
              onRoleChange={(id, roleId) => updateMut.mutate({ id, body: { roleId } })}
              onEdit={openEdit}
              onDeactivate={(id) => deactivateMut.mutate(id)}
              onActivate={(id) => updateMut.mutate({ id, body: { isActive: true } })}
              isUpdating={updateMut.isPending || deactivateMut.isPending}
              hasActiveFilters={hasActiveFilters}
            />
            <UsersTeamAccessOverview />
          </div>

          <UsersInsightsColumn
            users={allUsers}
            activity={activityQuery.data?.items}
            activityLoading={activityQuery.isLoading}
          />
        </div>
      </div>

      {editingUser && editingUserRecord && (
        <UsersEditModal
          user={editingUserRecord}
          form={editingUser}
          onChange={(patch) => setEditingUser((f) => (f ? { ...f, ...patch } : f))}
          onClose={closeEdit}
          onSave={() => {
            updateMut.mutate(
              { id: editingUserRecord.id, body: editingUser },
              { onSuccess: closeEdit },
            );
          }}
          isPending={updateMut.isPending}
        />
      )}
    </div>
    </OrgContextGate>
  );
}
