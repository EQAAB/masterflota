import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrganization, fetchOrganizations } from "../../api/organizations";
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
  const canCreate = usePermission("organizations.create");
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateOrgForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

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
        adminPassword: form.adminPassword,
        adminFirstName: form.adminFirstName.trim() || undefined,
        adminLastName: form.adminLastName.trim() || undefined,
      }),
    onSuccess: () => {
      setShowForm(false);
      setForm(emptyForm);
      setFormError(null);
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
    if (form.adminPassword.length < 8) {
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
            <h1 className="text-2xl font-bold tracking-tight text-ink">Organizations</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Create and manage fleet organizations. Only super admins can access this page.
            </p>
          </div>
          <button
            type="button"
            className={showForm ? btnSecondary : btnPrimary}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Cancel" : "Create organization"}
          </button>
        </header>

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
                  <div>
                    <label className={sectionLabel}>Admin password *</label>
                    <input
                      type="password"
                      className={input}
                      value={form.adminPassword}
                      onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))}
                      required
                    />
                  </div>
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
