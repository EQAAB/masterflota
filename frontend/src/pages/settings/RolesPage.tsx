import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  createRole,
  deleteRole,
  fetchPermissions,
  fetchRoles,
  updateRolePermissions,
} from "../../api/roles";
import { CreateRoleModal, type CreateRoleForm } from "../../components/settings/roles/CreateRoleModal";
import { OrgContextGate } from "../../components/layout/OrgContextGate";
import { RoleCard } from "../../components/settings/roles/RoleCard";
import { RolesKpiRow } from "../../components/settings/roles/RolesKpiRow";
import { RolesPageHeader } from "../../components/settings/roles/RolesPageHeader";
import { computeRolesKpis } from "../../components/settings/roles/rolesListUtils";
import { useAnyPermission, usePermission } from "../../lib/permissions";
import { dashboardPage } from "../../theme/classNames";

const emptyCreateForm: CreateRoleForm = { name: "", description: "" };

export function RolesPage() {
  const { t } = useTranslation();
  const canView = useAnyPermission("roles.manage", "users.manage");
  const canManage = usePermission("roles.manage");
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRoleForm>(emptyCreateForm);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: () => fetchRoles().then((r) => r.data),
    enabled: canView,
  });
  const permsQuery = useQuery({
    queryKey: ["permissions"],
    queryFn: () => fetchPermissions().then((r) => r.data),
    enabled: canView,
  });

  const createMut = useMutation({
    mutationFn: () =>
      createRole({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
      }),
    onSuccess: () => {
      setShowCreate(false);
      setCreateForm(emptyCreateForm);
      void queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  const permMut = useMutation({
    mutationFn: ({ id, permissionNames }: { id: string; permissionNames: string[] }) =>
      updateRolePermissions(id, permissionNames),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["roles"] }),
    onSettled: () => setSavingRoleId(null),
  });

  const roles = rolesQuery.data ?? [];
  const permissions = permsQuery.data ?? [];
  const kpis = useMemo(() => computeRolesKpis(roles, permissions), [roles, permissions]);

  const handleTogglePermission = (
    roleId: string,
    permissionName: string,
    enabled: boolean,
    current: string[],
  ) => {
    const next = enabled
      ? [...new Set([...current, permissionName])]
      : current.filter((p) => p !== permissionName);
    setSavingRoleId(roleId);
    permMut.mutate({ id: roleId, permissionNames: next });
  };

  const handleDelete = (role: { id: string; name: string }) => {
    if (!window.confirm(t("pages.roles.deleteRoleConfirm", { name: role.name }))) return;
    deleteMut.mutate(role.id);
  };

  if (!canView) {
    return (
      <div className="fm-settings-roles flex min-h-full flex-1 flex-col">
        <div className={dashboardPage}>
          <p className="text-ink-muted">{t("pages.roles.noAccessRoles")}</p>
        </div>
      </div>
    );
  }

  return (
    <OrgContextGate>
    <div className="fm-settings-roles flex min-h-full flex-1 flex-col">
      <div className={dashboardPage}>
        <RolesPageHeader onCreate={() => setShowCreate(true)} canManage={canManage} />

        <RolesKpiRow kpis={kpis} loading={rolesQuery.isLoading || permsQuery.isLoading} />

        {(rolesQuery.isError || permsQuery.isError) && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {t("pages.roles.failedToLoadRoles")}
          </p>
        )}

        <div className="space-y-5">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              permissions={permissions}
              canManage={canManage}
              isSaving={savingRoleId === role.id && permMut.isPending}
              onTogglePermission={handleTogglePermission}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      <CreateRoleModal
        open={showCreate}
        form={createForm}
        onChange={(patch) => setCreateForm((f) => ({ ...f, ...patch }))}
        onClose={() => setShowCreate(false)}
        onSubmit={() => createMut.mutate()}
        isPending={createMut.isPending}
      />
    </div>
    </OrgContextGate>
  );
}
