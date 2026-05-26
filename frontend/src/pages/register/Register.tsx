import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuthStore, type AuthUser } from "../../store/authStore";
import { alertError, btnPrimary, card, input, linkAccent, sectionLabel } from "../../theme/classNames";

interface RegisterResponse {
  token: string;
  user: AuthUser;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<RegisterResponse>("/auth/register", {
        organizationName,
        email,
        password,
        phone: phone || undefined,
      });
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate("/dashboard");
    },
  });

  const validate = () => {
    if (!organizationName.trim()) return "Organization name is required.";
    if (!email.includes("@")) return "Please enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!acceptedTerms) return "You must accept the terms and conditions.";
    return null;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    mutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className={`w-full max-w-lg ${card} p-8 shadow-soft-lg`}>
        <h1 className="text-2xl font-semibold mb-2 text-ink">Create organization</h1>
        <p className="text-sm text-ink-muted mb-6">Register your fleet management account as an admin.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={sectionLabel}>Organization name *</label>
            <input
              type="text"
              className={input}
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={sectionLabel}>Work email *</label>
            <input
              type="email"
              className={input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={sectionLabel}>Phone (optional)</label>
            <input
              type="tel"
              className={input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className={sectionLabel}>Password *</label>
            <input
              type="password"
              className={input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={sectionLabel}>Confirm password *</label>
            <input
              type="password"
              className={input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 rounded border-border"
            />
            <span>I accept the terms and conditions</span>
          </label>
          {(formError || mutation.isError) && (
            <p className={alertError}>
              {formError ||
                ((mutation.error as Error)?.message ?? "Registration failed. Please try again.")}
            </p>
          )}
          <button type="submit" disabled={mutation.isPending} className={`w-full ${btnPrimary}`}>
            {mutation.isPending ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-xs text-ink-muted text-center">
          Already have an account?{" "}
          <Link to="/login" className={linkAccent}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
