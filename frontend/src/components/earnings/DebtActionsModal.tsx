import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import type { DebtAdjustType, PayoutListItem } from "../../api/earnings";
import { postPayoutAdjustDebt } from "../../api/earnings";
import { formatCurrency } from "../../utils/currency";

type DebtActionsModalProps = {
  row: PayoutListItem | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function toNum(value: string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function DebtActionsModal({ row, open, onClose, onSuccess }: DebtActionsModalProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open || !row) return null;

  const remaining = toNum(row.remaining_debt_amount);
  const rawNet = toNum(row.raw_net_amount);
  const amountParsed = parseFloat(amount);
  const amountOk = Number.isFinite(amountParsed);
  const amountTrim = amount.trim();

  /** Full forgive when amount left blank; otherwise capped partial reduce (same as forgive / cash_received). */
  const reducePreviewRem =
    amountTrim === ""
      ? 0
      : amountOk && amountParsed > 0
        ? Math.max(0, round2(remaining - Math.min(remaining, round2(amountParsed))))
        : null;
  const adjustPreviewRem = amountOk ? Math.max(0, round2(remaining - round2(amountParsed))) : null;
  const showAdjustOnlyPreview =
    amountOk &&
    amountParsed !== 0 &&
    (amountParsed < 0 || (amountTrim !== "" && reducePreviewRem === null && adjustPreviewRem !== null));

  const resetForm = () => {
    setNote("");
    setAmount("");
    setErr(null);
  };

  const handleClose = () => {
    if (!busy) {
      resetForm();
      onClose();
    }
  };

  const submit = async (type: DebtAdjustType, opts?: { amount?: number }) => {
    setBusy(true);
    setErr(null);
    try {
      await postPayoutAdjustDebt(row.id, {
        type,
        note: note.trim() || undefined,
        amount: opts?.amount,
      });
      resetForm();
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? t("pages.payoutModals.requestFailedError"))
          : t("pages.payoutModals.requestFailedError");
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-ink">{t("pages.payoutModals.debtActionsTitle")}</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            {row.first_name} {row.last_name} · {row.payment_period_start?.slice(0, 10)} – {row.payment_period_end?.slice(0, 10)}
          </p>
          <p className="text-xs text-ink-muted mt-1 tabular-nums">
            {t("pages.payoutModals.rawNetRemainingDebtLine", { rawNet: formatCurrency(rawNet), debt: formatCurrency(remaining) })}
          </p>
        </div>

        <div className="px-4 py-3 space-y-3">
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>}

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">{t("pages.payoutModals.noteOptionalLabel")}</label>
            <textarea
              className="w-full rounded-lg border border-border px-3 py-2 text-sm min-h-[72px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={busy}
              placeholder={t("pages.payoutModals.reasonForAdjustmentPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">{t("pages.payoutModals.amountRonWhereNeededLabel")}</label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm tabular-nums"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={busy}
              placeholder={t("pages.payoutModals.amountExamplePlaceholder")}
            />
          </div>

          {(reducePreviewRem !== null || (adjustPreviewRem !== null && showAdjustOnlyPreview)) && (
            <div className="rounded-lg border border-border bg-slate-50 px-3 py-2 text-xs text-ink space-y-1 tabular-nums">
              <p className="font-medium text-ink">{t("pages.payoutModals.previewBeforeConfirmTitle")}</p>
              {reducePreviewRem !== null && (
                <p>
                  <Trans
                    i18nKey="pages.payoutModals.forgiveCashPositiveAdjustPreview"
                    values={{ amount: formatCurrency(reducePreviewRem) }}
                    components={{ b: <span className="font-semibold" /> }}
                  />
                </p>
              )}
              {adjustPreviewRem !== null && showAdjustOnlyPreview && (
                <p>
                  <Trans
                    i18nKey="pages.payoutModals.manualAdjustPreview"
                    values={{ amount: formatCurrency(adjustPreviewRem) }}
                    components={{ b: <span className="font-semibold" /> }}
                  />{" "}
                  <span className="text-ink-muted">{t("pages.payoutModals.negativeAmountIncreasesHint")}</span>
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const v = amount.trim() === "" ? undefined : parseFloat(amount);
                if (v !== undefined && (!Number.isFinite(v) || v <= 0)) {
                  setErr(t("pages.payoutModals.partialForgiveError"));
                  return;
                }
                void submit("forgive", v !== undefined ? { amount: v } : undefined);
              }}
              className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
            >
              {t("pages.payoutModals.forgiveDebtOption")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const v = parseFloat(amount);
                if (!Number.isFinite(v) || v <= 0) {
                  setErr(t("pages.payoutModals.cashReceivedError"));
                  return;
                }
                void submit("cash_received", { amount: v });
              }}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
            >
              {t("pages.payoutModals.cashReceivedOption")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const v = parseFloat(amount);
                if (!Number.isFinite(v)) {
                  setErr(t("pages.payoutModals.manualAdjustError"));
                  return;
                }
                void submit("adjust", { amount: v });
              }}
              className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {t("pages.payoutModals.manualAdjustAdvancedOption")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit("carry_forward")}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-50"
            >
              {t("pages.payoutModals.carryForwardOption")}
            </button>
          </div>
          <p className="text-[11px] text-ink-muted">
            {t("pages.payoutModals.carryForwardDesc")}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            disabled={busy}
            onClick={handleClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-ink hover:bg-slate-50"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
