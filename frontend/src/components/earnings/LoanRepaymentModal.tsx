import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import type { ConsolidatedDriverPayout } from "../../api/earnings";
import { postLoanRepaymentFromPayout } from "../../api/driverLoans";
import { formatCurrency } from "../../utils/currency";

type LoanRepaymentModalProps = {
  row: ConsolidatedDriverPayout | null;
  weekStart: string;
  weekEnd: string;
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

export function LoanRepaymentModal({
  row,
  weekStart,
  weekEnd,
  open,
  onClose,
  onSuccess,
}: LoanRepaymentModalProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open || !row) return null;

  const outstanding = toNum(row.outstanding_loan_balance);
  const weekNet = toNum(row.total_amount);
  const maxRepay = round2(Math.min(outstanding, Math.max(0, weekNet)));
  const amountParsed = parseFloat(amount);
  const amountOk = Number.isFinite(amountParsed) && amountParsed > 0;
  const amountTrim = amount.trim();

  const previewRem =
    amountTrim === ""
      ? null
      : amountOk
        ? Math.max(0, round2(outstanding - Math.min(outstanding, round2(amountParsed))))
        : null;

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

  const submit = async (opts: { settle_full?: boolean; amount?: number }) => {
    setBusy(true);
    setErr(null);
    try {
      await postLoanRepaymentFromPayout(row.driver_id, {
        payment_period_start: weekStart,
        payment_period_end: weekEnd,
        settle_full: opts.settle_full,
        amount: opts.amount,
        notes: note.trim() || undefined,
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

  if (outstanding <= 0.02) {
    return null;
  }

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
          <h2 className="text-lg font-semibold text-ink">{t("pages.payoutModals.loanRepaymentTitle")}</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            {row.first_name} {row.last_name} · {weekStart} – {weekEnd}
          </p>
          <p className="text-xs text-ink-muted mt-1 tabular-nums">
            {t("pages.payoutModals.weekNetLoanOutstandingLine", { weekNet: formatCurrency(weekNet), outstanding: formatCurrency(outstanding) })}
          </p>
          {maxRepay < outstanding && weekNet > 0.02 && (
            <p className="text-xs text-amber-800 mt-1">
              {t("pages.payoutModals.upToCanBeTakenHint", { amount: formatCurrency(maxRepay) })}
            </p>
          )}
          {row.planned_repayment_week?.slice(0, 10) === weekStart.slice(0, 10) && (
            <p className="text-xs text-sky-800 mt-1">
              {t("pages.payoutModals.plannedRepaymentWeekLabel")}
              {row.planned_repayment_note?.trim() ? t("pages.payoutModals.plannedRepaymentNoteSuffix", { note: row.planned_repayment_note.trim() }) : ""}
            </p>
          )}
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
              placeholder={t("pages.payoutModals.repaymentNotePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              {t("pages.payoutModals.amountFromThisPayoutLabel")}
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm tabular-nums"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={busy}
              placeholder={t("pages.payoutModals.maxAmountPlaceholder", { amount: maxRepay.toFixed(2) })}
            />
          </div>

          {previewRem !== null && (
            <div className="rounded-lg border border-border bg-slate-50 px-3 py-2 text-xs text-ink tabular-nums">
              <p className="font-medium text-ink">{t("pages.payoutModals.previewLabel")}</p>
              <p>
                <Trans
                  i18nKey="pages.payoutModals.loanRemainingPreview"
                  values={{ amount: formatCurrency(previewRem) }}
                  components={{ b: <span className="font-semibold" /> }}
                />
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 pt-1">
            <button
              type="button"
              disabled={busy || maxRepay <= 0.02}
              onClick={() => {
                const v = amount.trim() === "" ? undefined : parseFloat(amount);
                if (v !== undefined && (!Number.isFinite(v) || v <= 0)) {
                  setErr(t("pages.payoutModals.loanAmountPositiveError"));
                  return;
                }
                void submit({ amount: v });
              }}
              className="rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-100 disabled:opacity-50"
            >
              {t("pages.payoutModals.takeFromThisPayoutButton")}
            </button>
            <button
              type="button"
              disabled={busy || maxRepay <= 0.02}
              onClick={() => void submit({ settle_full: true })}
              className="rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50"
            >
              {t("pages.payoutModals.settleFullLoanButton")}
              {maxRepay < outstanding ? t("pages.payoutModals.settleFullLoanUpToSuffix", { amount: formatCurrency(maxRepay) }) : ""}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-ink-muted hover:bg-slate-50"
            >
              {t("pages.payoutModals.skipThisWeekButton")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
