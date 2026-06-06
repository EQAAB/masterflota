import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import type { AuthUser } from "../../store/authStore";
import { LoginAuthField } from "../../components/auth/LoginAuthField";
import { FleetManagerLogoMark } from "../../components/brand/FleetManagerLogoMark";
import { alertError, btnPrimary } from "../../theme/classNames";

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
      navigate(isPlatformSuperAdmin ? "/platform" : "/dashboard");
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="fm-login-page flex min-h-screen items-center justify-center p-4">
      <div className="fm-login-page__card">
        <header className="text-center">
          <div className="fm-login-page__logo-wrap">
            <FleetManagerLogoMark className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Fleet Manager</h1>
          <p className="mt-1 text-sm text-ink-muted">Sign in to your organization dashboard</p>
        </header>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <LoginAuthField
            id="login-email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />
          <LoginAuthField
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />
          {mutation.isError && (
            <p className={alertError}>
              {(mutation.error as Error).message || "Login failed. Check your credentials."}
            </p>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className={`fm-login-page__submit ${btnPrimary}`}
          >
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="fm-login-page__footer">Secure access for fleet operations</p>
      </div>
    </div>
  );
}
