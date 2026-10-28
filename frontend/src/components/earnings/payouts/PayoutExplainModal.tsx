import { useEffect, useId, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { explainPayout, type PayoutExplainResponse } from "../../../api/earnings";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";

export type PayoutExplainModalProps = {
  open: boolean;
  onClose: () => void;
  driverId: string;
  weekStart: string;
  weekEnd: string;
  driverName: string;
};

function errMessage(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) {
    const m = e.response?.data as { message?: string } | undefined;
    if (m?.message) return m.message;
    return e.message;
  }
  return e instanceof Error ? e.message : fallback;
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

  const mutation = useMutation({
    mutationFn: () =>
      explainPayout({ driverId, weekStart, weekEnd }).then((r) => r.data),
  });

  useEffect(() => {
    if (!open) {
      mutation.reset();
      setCopied(false);
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

  if (!open) return null;

  const data: PayoutExplainResponse | undefined = mutation.data;

  async function handleCopy() {
    if (!data) return;
    const text = [data.summary, "", ...data.bullets.map((b) => `• ${b}`), "", data.disclaimer].join(
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
                {data.bullets.map((b) => (
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
