import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import type { AuthUser } from "../../store/authStore";
import { input, sectionLabel, btnPrimary, card, alertError } from "../../theme/classNames";

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      const isPlatformSuperAdmin =
        data.user.role === "super_admin" && !data.user.organizationId;
      navigate(isPlatformSuperAdmin ? "/settings/organizations" : "/dashboard");
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className={`w-full max-w-md ${card} p-8 shadow-soft-lg`}>
        <h1 className="text-2xl font-semibold mb-2 text-ink">Fleet Manager</h1>
        <p className="text-sm text-ink-muted mb-6">Sign in to your organization</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={sectionLabel}>Email</label>
            <input
              type="email"
              className={input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={sectionLabel}>Password</label>
            <input
              type="password"
              className={input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {mutation.isError && (
            <p className={alertError}>
              {(mutation.error as Error).message || "Login failed. Check your credentials."}
            </p>
          )}
          <button type="submit" disabled={mutation.isPending} className={`w-full ${btnPrimary}`}>
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
