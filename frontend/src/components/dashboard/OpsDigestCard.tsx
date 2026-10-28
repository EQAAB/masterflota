import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { OpsDigestItem, OpsDigestSeverity } from "../../api/dashboard";

export type OpsDigestCardProps = {
  items: OpsDigestItem[];
  narrative: string | null;
  aiEnabled: boolean;
  isLoading?: boolean;
  isError?: boolean;
};

function severityClass(severity: OpsDigestSeverity): string {
  if (severity === "high") return "border-rose-200 bg-rose-50 text-rose-800";
  if (severity === "medium") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function OpsDigestCard({
  items,
  narrative,
  aiEnabled,
  isLoading = false,
  isError = false,
}: OpsDigestCardProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-ink">
            {t("pages.dashboard.opsDigestTitle")}
          </h2>
          <p className="mt-1 text-xs text-ink-muted">{t("pages.dashboard.opsDigestHint")}</p>
        </div>
      </div>

      {isLoading && (
        <p className="mt-4 text-sm text-ink-muted">{t("pages.dashboard.opsDigestLoading")}</p>
      )}

      {isError && !isLoading && (
        <p className="mt-4 text-sm text-rose-700">{t("pages.dashboard.opsDigestFailed")}</p>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className="mt-4 text-sm text-ink-muted">
          {aiEnabled
            ? t("pages.dashboard.opsDigestEmpty")
            : t("pages.dashboard.opsDigestEmptyNoAi")}
        </p>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="mt-4 space-y-3">
          {narrative && (
            <p className="rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-2.5 text-sm leading-relaxed text-ink">
              {narrative}
            </p>
          )}
          {!narrative && !aiEnabled && (
            <p className="text-xs text-ink-muted">{t("pages.dashboard.opsDigestAiOffHint")}</p>
          )}
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.link}
                  className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 transition hover:opacity-90 ${severityClass(item.severity)}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs opacity-90">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{item.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
