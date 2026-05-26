import { useState } from "react";
import type { PayoutListItem } from "../../api/earnings";
import { postReleasePayoutHold } from "../../api/earnings";
import { formatCurrency } from "../../utils/currency";

type ReleaseHoldModalProps = {
  row: PayoutListItem | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function toNum(value: string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function ReleaseHoldModal({ row, open, onClose, onSuccess }: ReleaseHoldModalProps) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open || !row) return null;

  const remaining = toNum(row.remaining_debt_amount);
  const rawNet = toNum(row.raw_net_amount);

  const resetForm = () => {
    setNotes("");
    setErr(null);
  };

  const handleClose = () => {
    if (!busy) {
      resetForm();
      onClose();
    }
  };

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      await postReleasePayoutHold(row.id, { notes: notes.trim() || undefined });
      resetForm();
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Request failed")
          : "Request failed";
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
          <h2 className="text-lg font-semibold text-ink">Release hold</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            {row.first_name} {row.last_name} · {row.payment_period_start?.slice(0, 10)} –{" "}
            {row.payment_period_end?.slice(0, 10)}
          </p>
          <p className="text-xs text-ink-muted mt-1 tabular-nums">
            Raw net: {formatCurrency(rawNet)} · Remaining debt: {formatCurrency(remaining)}
          </p>
          {row.hold_reason && (
            <p className="text-xs text-amber-800 mt-2">
              Hold reason: <span className="font-medium">{row.hold_reason}</span>
            </p>
          )}
        </div>

        <div className="px-4 py-3 space-y-3">
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>}

          <p className="text-sm text-ink-muted">
            This clears the hold and sets the payout to{" "}
            <span className="font-medium">{remaining > 0 ? "debt" : "pending"}</span> so it can continue in the
            payment workflow.
          </p>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">Release notes (optional)</label>
            <textarea
              className="w-full rounded-lg border border-border px-3 py-2 text-sm min-h-[72px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={busy}
              placeholder="Why is this hold being released?"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            disabled={busy}
            onClick={handleClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-ink hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
          >
            {busy ? "Releasing…" : "Release hold"}
          </button>
        </div>
      </div>
    </div>
  );
}
