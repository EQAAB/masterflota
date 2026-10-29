import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useTranslation } from "react-i18next";
import {
  explainPayout,
  type PayoutExplainResponse,
} from "../../../api/earnings";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";

export type PayoutExplainModalProps = {
  open: boolean;
  onClose: () => void;
  driverId: string;
  weekStart: string;
  weekEnd: string;
  driverName: string;
};

type ViewMode = "short" | "platforms";

function errMessage(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) {
    const m = e.response?.data as { message?: string } | undefined;
    if (m?.message) return m.message;
    return e.message;
  }
  return e instanceof Error ? e.message : fallback;
}

function formatMoney(n: number, currency: string): string {
  return `${n.toFixed(2)} ${currency}`;
}

function platformLabel(platform: string): string {
  return platform.replace(/_/g, " ");
}

function buildPlatformBullets(
  data: PayoutExplainResponse,
  labels: {
    combinedFinal: string;
    vehicleRent: string;
    debtApplied: string;
    debtOffset: string;
  },
): string[] {
  const { breakdown } = data;
  const c = breakdown.currency;
  const platforms = breakdown.platforms ?? [];
  const lines = platforms.map((p) => {
    const parts = [
      `gross ${formatMoney(p.gross, c)}`,
      `fees ${formatMoney(p.platformFees, c)}`,
      `commission ${formatMoney(p.commission, c)}`,
    ];
    if (p.cash > 0.02) parts.push(`cash ${formatMoney(p.cash, c)}`);
    parts.push(`net ${formatMoney(p.netDriverPayout, c)}`);
    return `${platformLabel(p.platform)}: ${parts.join(" · ")}`;
  });

  if (breakdown.totalVehicleRent > 0.02) {
    lines.push(`${labels.vehicleRent}: ${formatMoney(breakdown.totalVehicleRent, c)}`);
  }
  if (breakdown.debtOffset > 0.02) {
    lines.push(`${labels.debtOffset}: ${formatMoney(breakdown.debtOffset, c)}`);
  }
  if (breakdown.debtApplied > 0.02) {
    lines.push(`${labels.debtApplied}: ${formatMoney(breakdown.debtApplied, c)}`);
  }
  lines.push(`${labels.combinedFinal}: ${formatMoney(breakdown.finalNet, c)}`);
  return lines;
}

export function PayoutExplainModal({
  open,
  onClose,
  driverId,
  weekStart,
  weekEnd,
  driverName,
}: PayoutExplainModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("short");

  const mutation = useMutation({
    mutationFn: () =>
      explainPayout({ driverId, weekStart, weekEnd }).then((r) => r.data),
  });

  useEffect(() => {
    if (!open) {
      mutation.reset();
      setCopied(false);
      setViewMode("short");
      return;
    }
    mutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when opened
  }, [open, driverId, weekStart, weekEnd]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !mutation.isPending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, mutation.isPending]);

  const data: PayoutExplainResponse | undefined = mutation.data;
  const platformCount = data?.breakdown?.platforms?.length ?? 0;
  const showViewToggle = platformCount > 1;
  const effectiveMode: ViewMode =
    showViewToggle && viewMode === "platforms" ? "platforms" : "short";

  const visibleBullets = useMemo(() => {
    if (!data) return [];
    if (effectiveMode === "short") return data.bullets;
    return buildPlatformBullets(data, {
      combinedFinal: t("pages.earningsPayouts.detail.explainPayoutCombinedFinal"),
      vehicleRent: t("pages.earningsPayouts.detail.explainPayoutVehicleRent"),
      debtApplied: t("pages.earningsPayouts.detail.explainPayoutDebtApplied"),
      debtOffset: t("pages.earningsPayouts.detail.explainPayoutDebtOffset"),
    });
  }, [data, effectiveMode, t]);

  if (!open) return null;

  async function handleCopy() {
    if (!data) return;
    const text = [data.summary, "", ...visibleBullets.map((b) => `• ${b}`), "", data.disclaimer].join(
      "\n",
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label={t("common.close")}
        onClick={() => !mutation.isPending && onClose()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-white shadow-xl"
      >
        <div className="border-b border-border px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-ink">
            {t("pages.earningsPayouts.detail.explainPayoutTitle")}
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            {t("pages.earningsPayouts.detail.explainPayoutSubtitle", {
              name: driverName,
              from: weekStart,
              to: weekEnd,
            })}
          </p>
          {data && showViewToggle && (
            <div
              className="mt-3 inline-flex rounded-lg border border-border bg-slate-50 p-0.5"
              role="tablist"
              aria-label={t("pages.earningsPayouts.detail.explainPayoutViewAria")}
            >
              <button
                type="button"
                role="tab"
                aria-selected={effectiveMode === "short"}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  effectiveMode === "short"
                    ? "bg-white text-ink shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
                onClick={() => setViewMode("short")}
              >
                {t("pages.earningsPayouts.detail.explainPayoutViewShort")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={effectiveMode === "platforms"}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  effectiveMode === "platforms"
                    ? "bg-white text-ink shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
                onClick={() => setViewMode("platforms")}
              >
                {t("pages.earningsPayouts.detail.explainPayoutViewPlatforms")}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {mutation.isPending && (
            <p className="text-sm text-ink-muted">{t("pages.earningsPayouts.detail.explainPayoutLoading")}</p>
          )}
          {mutation.isError && (
            <p className="text-sm text-rose-700">
              {errMessage(mutation.error, t("pages.earningsPayouts.detail.explainPayoutFailed"))}
            </p>
          )}
          {data && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-ink">{data.summary}</p>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink">
                {visibleBullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p className="text-xs text-ink-muted">{data.disclaimer}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3">
          {data && (
            <button type="button" className={`${btnSecondary} !text-xs`} onClick={() => void handleCopy()}>
              {copied
                ? t("pages.earningsPayouts.detail.explainPayoutCopied")
                : t("pages.earningsPayouts.detail.explainPayoutCopy")}
            </button>
          )}
          <button
            type="button"
            className={`${btnPrimary} !text-xs`}
            disabled={mutation.isPending}
            onClick={onClose}
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
