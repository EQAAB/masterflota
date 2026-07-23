import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../api/auth";
import { PasswordInput } from "../../components/theme/PasswordInput";
import { useAuthStore } from "../../store/authStore";
import { roleLabel } from "../../lib/roleLabel";
import { alertError, alertSuccess, btnPrimary, card, dashboardPage, input, sectionLabel } from "../../theme/classNames";

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      setSuccess(res.data.message ?? "Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => {
        logout();
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg ?? "Failed to change password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated">
      <div className={`${dashboardPage} max-w-xl space-y-6`}>
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Profile</h1>
          <p className="mt-1 text-sm text-ink-muted">Account details and password security.</p>
        </header>

        <section className={`${card} p-5 shadow-card`}>
          <h2 className="text-sm font-semibold text-ink">Account</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className={sectionLabel}>Name</dt>
              <dd className="mt-1 text-ink">
                {user?.firstName} {user?.lastName}
              </dd>
            </div>
            <div>
              <dt className={sectionLabel}>Email</dt>
              <dd className="mt-1 text-ink">{user?.email}</dd>
            </div>
            <div>
              <dt className={sectionLabel}>Role</dt>
              <dd className="mt-1 text-ink">{user ? roleLabel(user.role) : "—"}</dd>
            </div>
          </dl>
        </section>

        <section className={`${card} p-5 shadow-card`}>
          <h2 className="text-sm font-semibold text-ink">Change password</h2>
          <p className="mt-1 text-sm text-ink-muted">
            You will be signed out on all devices after saving a new password.
          </p>

          {error && <p className={`${alertError} mt-4`}>{error}</p>}
          {success && <p className={`${alertSuccess} mt-4`}>{success}</p>}

          <form className="mt-4 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <label className="block">
              <span className={sectionLabel}>Current password</span>
              <PasswordInput
                className="mt-1.5"
                value={currentPassword}
                onChange={setCurrentPassword}
                required
              />
            </label>
            <label className="block">
              <span className={sectionLabel}>New password</span>
              <PasswordInput
                className="mt-1.5"
                value={newPassword}
                onChange={setNewPassword}
                showStrength
                required
              />
            </label>
            <label className="block">
              <span className={sectionLabel}>Confirm new password</span>
              <input
                type="password"
                className={`${input} mt-1.5`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy ? "Saving…" : "Update password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
