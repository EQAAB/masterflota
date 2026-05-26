import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { CustomFeeType, DriverPayoutCustomFee, PayoutListItem } from "../../api/earnings";
import {
  deletePayoutCustomFee,
  getPayoutCustomFees,
  postPayoutCustomFee,
} from "../../api/earnings";
import { formatCurrency } from "../../utils/currency";

type CustomFeesModalProps = {
  row: PayoutListItem | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function toNum(value: string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function CustomFeesModal({ row, open, onClose, onSuccess }: CustomFeesModalProps) {
  const [feeName, setFeeName] = useState("");
  const [feeType, setFeeType] = useState<CustomFeeType>("deduction");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const payoutId = row?.id ?? "";
  const q = useQuery({
    queryKey: ["earnings", "payout-custom-fees", payoutId],
    queryFn: () => getPayoutCustomFees(payoutId).then((r) => r.data),
    enabled: open && !!payoutId,
  });

  useEffect(() => {
    if (!open) {
      setFeeName("");
      setFeeType("deduction");
      setAmount("");
      setNotes("");
      setErr(null);
    }
  }, [open]);

  if (!open || !row) return null;

  const locked = row.payment_status === "paid" || row.payment_status === "approved";
  const amountParsed = parseFloat(amount);
  const amountOk = Number.isFinite(amountParsed) && amountParsed >= 0;
  const canSubmit = feeName.trim().length > 0 && feeName.trim().length <= 100 && amountOk && !busy && !locked;

  const handleClose = () => {
    if (!busy && !deleteBusyId) onClose();
  };

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    try {
      await postPayoutCustomFee(payoutId, {
        fee_name: feeName.trim(),
        fee_type: feeType,
        amount: amountParsed,
        notes: notes.trim() || undefined,
      });
      setFeeName("");
      setAmount("");
      setNotes("");
      await q.refetch();
      onSuccess();
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

  const removeFee = async (adjustmentId: string) => {
    setDeleteBusyId(adjustmentId);
    setErr(null);
    try {
      await deletePayoutCustomFee(payoutId, adjustmentId);
      await q.refetch();
      onSuccess();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Request failed")
          : "Request failed";
      setErr(msg);
    } finally {
      setDeleteBusyId(null);
    }
  };

  const data = q.data;
  const recurringItems = data?.recurring_items ?? data?.items.filter((i) => i.source === "recurring") ?? [];
  const manualItems = data?.manual_items ?? data?.items.filter((i) => i.source === "manual") ?? [];

  const renderFeeLine = (item: DriverPayoutCustomFee, readOnly: boolean) => (
    <li key={item.id} className="flex items-start justify-between gap-2 px-3 py-2 text-sm bg-white">
      <div>
        <span className="font-medium text-ink">{item.fee_name}</span>
        <span
          className={`ml-2 text-xs font-medium ${
            item.fee_type === "deduction" ? "text-rose-700" : "text-emerald-700"
          }`}
        >
          {item.fee_type === "deduction" ? "Deduction" : "Addition"}
        </span>
        {readOnly && (
          <span className="ml-2 text-xs text-violet-600">(recurring)</span>
        )}
        <div className="text-ink tabular-nums mt-0.5">
          {item.fee_type === "deduction" ? "−" : "+"}
          {formatCurrency(toNum(item.amount))}
        </div>
        {item.notes && <p className="text-xs text-ink-muted mt-0.5">{item.notes}</p>}
      </div>
      {!readOnly && !locked && (
        <button
          type="button"
          disabled={!!deleteBusyId || busy}
          onClick={() => void removeFee(item.id)}
          className="shrink-0 text-xs text-rose-700 hover:underline disabled:opacity-50"
        >
          {deleteBusyId === item.id ? "Removing…" : "Delete"}
        </button>
      )}
    </li>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-white shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-ink">Custom fees</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            {row.first_name} {row.last_name} · {row.payment_period_start?.slice(0, 10)} –{" "}
            {row.payment_period_end?.slice(0, 10)}
          </p>
        </div>

        <div className="px-4 py-3 space-y-4">
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>}

          {q.isLoading && <p className="text-sm text-ink-muted">Loading…</p>}
          {q.isError && <p className="text-sm text-red-700">Failed to load custom fees.</p>}

          {data && (
            <div className="rounded-lg bg-slate-50 border border-border px-3 py-2 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-ink-muted">Base payout</span>
                <span className="tabular-nums font-medium">{formatCurrency(toNum(data.base_raw_net))}</span>
              </div>
              <div className="flex justify-between text-rose-800">
                <span>Custom deductions</span>
                <span className="tabular-nums">−{formatCurrency(toNum(data.total_deductions))}</span>
              </div>
              <div className="flex justify-between text-emerald-800">
                <span>Custom additions</span>
                <span className="tabular-nums">+{formatCurrency(toNum(data.total_additions))}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1">
                <span className="text-ink-muted">Adjusted raw net</span>
                <span className="tabular-nums font-medium">{formatCurrency(toNum(data.raw_net_amount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Final net payout</span>
                <span className="tabular-nums font-semibold text-ink">
                  {formatCurrency(toNum(data.net_driver_payout))}
                </span>
              </div>
            </div>
          )}

          {recurringItems.length > 0 && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Recurring fees (auto)
                </h3>
                {row.driver_id && (
                  <Link
                    to={`/drivers/${row.driver_id}`}
                    className="text-xs text-brand hover:underline"
                    onClick={handleClose}
                  >
                    Manage on profile
                  </Link>
                )}
              </div>
              <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {recurringItems.map((item) => renderFeeLine(item, true))}
              </ul>
            </div>
          )}

          {manualItems.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">
                Manual adjustments
              </h3>
              <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {manualItems.map((item) => renderFeeLine(item, false))}
              </ul>
            </div>
          )}

          {!locked && (
            <div className="space-y-3 border-t border-border pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Add manual adjustment
              </h3>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">Fee name</label>
                <input
                  type="text"
                  maxLength={100}
                  value={feeName}
                  onChange={(e) => setFeeName(e.target.value)}
                  placeholder="e.g. Accommodation"
                  disabled={busy}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Type</label>
                  <select
                    value={feeType}
                    onChange={(e) => setFeeType(e.target.value as CustomFeeType)}
                    disabled={busy}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <option value="deduction">Deduction</option>
                    <option value="addition">Addition</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Amount (RON)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={busy}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  disabled={busy}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => void submit()}
                className="w-full rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Add manual fee"}
              </button>
            </div>
          )}

          {locked && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              This payout is {row.payment_status} and cannot be edited.
            </p>
          )}
        </div>

        <div className="flex justify-end border-t border-border px-4 py-3">
          <button
            type="button"
            disabled={busy || !!deleteBusyId}
            onClick={handleClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-ink hover:bg-slate-50 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
