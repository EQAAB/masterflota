import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, Navigate } from "react-router-dom";
import { createOrganization, fetchOrganizations } from "../../api/organizations";
import { enterOrganizationWithCache } from "../../lib/orgContextActions";
import { isPlatformSuperAdmin } from "../../lib/platform";
import { useAuthStore } from "../../store/authStore";
import { PasswordInput } from "../../components/theme/PasswordInput";
import { TemporaryPasswordAlert } from "../../components/theme/TemporaryPasswordAlert";
import { usePermission } from "../../lib/permissions";
import {
  alertError,
  btnPrimary,
  btnSecondary,
  card,
  dashboardPage,
  input,
  sectionLabel,
} from "../../theme/classNames";

type CreateOrgForm = {
  name: string;
  email: string;
  phone: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
};

const emptyForm: CreateOrgForm = {
  name: "",
  email: "",
  phone: "",
  adminEmail: "",
  adminPassword: "",
  adminFirstName: "",
  adminLastName: "",
};

export function OrganizationsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const canCreate = usePermission("organizations.create");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  if (!isPlatformSuperAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateOrgForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const orgsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => fetchOrganizations().then((r) => r.data),
    enabled: canCreate,
  });

  const createMut = useMutation({
    mutationFn: () =>
      createOrganization({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        adminEmail: form.adminEmail.trim(),
        adminPassword: form.adminPassword.trim(),
        adminFirstName: form.adminFirstName.trim() || undefined,
        adminLastName: form.adminLastName.trim() || undefined,
      }).then((r) => r.data),
    onSuccess: (data) => {
      setShowForm(false);
      setForm(emptyForm);
      setFormError(null);
      setTemporaryPassword(data.temporaryPassword ?? null);
      void queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });

  if (!canCreate) {
    return (
      <div className="fm-settings-users flex min-h-full flex-1 flex-col">
        <div className={dashboardPage}>
          <p className="text-ink-muted">You do not have access to manage organizations.</p>
        </div>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Organization name is required.");
      return;
    }
    if (!form.adminEmail.includes("@")) {
      setFormError("Please enter a valid admin email.");
      return;
    }
    const pwd = form.adminPassword.trim();
    if (pwd.length > 0 && pwd.length < 8) {
      setFormError("Admin password must be at least 8 characters.");
      return;
    }
    setFormError(null);
    createMut.mutate();
  };

  return (
    <div className="fm-settings-users flex min-h-full flex-1 flex-col">
      <div className={`${dashboardPage} fm-settings-users__page`}>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">{t("pages.organizations.title")}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {t("pages.organizations.subtitle")}
            </p>
          </div>
          <button
            type="button"
            className={showForm ? btnSecondary : btnPrimary}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? t("common.cancel") : t("pages.organizations.add")}
          </button>
        </header>

        {temporaryPassword && (
          <TemporaryPasswordAlert
            heading="Organization and admin user created successfully."
            password={temporaryPassword}
            onDismiss={() => setTemporaryPassword(null)}
          />
        )}

        {showForm && (
          <div className={`${card} p-5 shadow-card`}>
            <h2 className="text-sm font-semibold text-ink">New organization</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Creates the organization and its first admin user.
            </p>
            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={sectionLabel}>Organization name *</label>
                  <input
                    className={input}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className={sectionLabel}>Organization email</label>
                  <input
                    type="email"
                    className={input}
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={sectionLabel}>Phone</label>
                  <input
                    className={input}
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  First admin user
                </h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={sectionLabel}>Admin email *</label>
                    <input
                      type="email"
                      className={input}
                      value={form.adminEmail}
                      onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                      required
                    />
                  </div>
                  <PasswordInput
                    label="Admin password"
                    value={form.adminPassword}
                    onChange={(adminPassword) => setForm((f) => ({ ...f, adminPassword }))}
                    helperText="Generate a strong password or leave blank to auto-generate on create."
                  />
                  <div>
                    <label className={sectionLabel}>First name</label>
                    <input
                      className={input}
                      value={form.adminFirstName}
                      onChange={(e) => setForm((f) => ({ ...f, adminFirstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={sectionLabel}>Last name</label>
                    <input
                      className={input}
                      value={form.adminLastName}
                      onChange={(e) => setForm((f) => ({ ...f, adminLastName: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {(formError || createMut.isError) && (
                <p className={alertError}>
                  {formError ||
                    ((createMut.error as Error)?.message ?? "Failed to create organization.")}
                </p>
              )}

              <button type="submit" disabled={createMut.isPending} className={btnPrimary}>
                {createMut.isPending ? "Creating…" : "Create organization"}
              </button>
            </form>
          </div>
        )}

        <div className={`${card} overflow-hidden shadow-card`}>
          {orgsQuery.isLoading ? (
            <p className="p-5 text-sm text-ink-muted">Loading organizations…</p>
          ) : orgsQuery.isError ? (
            <p className="p-5 text-sm text-rose-700">Failed to load organizations.</p>
          ) : (orgsQuery.data ?? []).length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-muted">No organizations yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(orgsQuery.data ?? []).map((org) => (
                  <tr key={org.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-ink">{org.name}</td>
                    <td className="px-4 py-3 text-ink-muted">{org.email ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">{org.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className={btnSecondary}
                        onClick={() => {
                          enterOrganizationWithCache(queryClient, org.id, org.name);
                          navigate("/dashboard");
                        }}
                      >
                        Enter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
