import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { extractVersionFromResponse } from "../../lib/appVersion";
import { acknowledgeServerVersion } from "../../store/appUpdateStore";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import type { AuthUser } from "../../store/authStore";
import { LoginAuthField } from "../../components/auth/LoginAuthField";
import { FleetManagerLogoMark } from "../../components/brand/FleetManagerLogoMark";
import { AppExternalLinks } from "../../components/brand/AppExternalLinks";
import { LanguageSwitcher } from "../../components/i18n/LanguageSwitcher";
import { getAppBranding } from "../../lib/appBranding";
import { alertError, btnPrimary } from "../../theme/classNames";

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const branding = getAppBranding();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<LoginResponse>("/auth/login", { email, password });
      const version = extractVersionFromResponse(response);
      if (version) acknowledgeServerVersion(version);
      return response.data;
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
      <div className="fm-login-page__card relative">
        <div className="absolute right-4 top-4">
          <LanguageSwitcher variant="compact" />
        </div>
        <header className="text-center">
          <div className="fm-login-page__logo-wrap">
            <FleetManagerLogoMark
              className="h-12 w-12"
              title={branding.appName}
              monogram={branding.logoMonogram}
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{branding.appName}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t("auth.signInSubtitle")}</p>
        </header>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <LoginAuthField
            id="login-email"
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />
          <LoginAuthField
            id="login-password"
            label={t("auth.password")}
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />
          {mutation.isError && (
            <p className={alertError}>
              {(mutation.error as Error).message || t("auth.loginFailed")}
            </p>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className={`fm-login-page__submit ${btnPrimary}`}
          >
            {mutation.isPending ? t("auth.signingIn") : t("auth.signIn")}
          </button>
        </form>

        <p className="fm-login-page__footer">{t("auth.secureAccess")}</p>
        <AppExternalLinks className="mt-3" />
      </div>
    </div>
  );
}
