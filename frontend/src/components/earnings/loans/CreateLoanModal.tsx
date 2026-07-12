import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { DriverListItem } from "../../../api/drivers";
import { postDriverLoan } from "../../../api/driverLoans";
import { DriverSearchCombobox } from "../../rentals/DriverSearchCombobox";

type CreateLoanModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (loanId: string) => void;
};

function parseApiError(e: unknown): string {
  if (e && typeof e === "object" && "response" in e) {
    return String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed");
  }
  return e instanceof Error ? e.message : "Failed";
}

export function CreateLoanModal({ open, onClose, onSuccess }: CreateLoanModalProps) {
  const [driver, setDriver] = useState<DriverListItem | null>(null);
  const [principal, setPrincipal] = useState("");
  const [disbursedAt, setDisbursedAt] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [plannedWeek, setPlannedWeek] = useState("");
  const [plannedNote, setPlannedNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDriver(null);
    setPrincipal("");
    setDisbursedAt("");
    setReference("");
    setNotes("");
    setPlannedWeek("");
    setPlannedNote("");
    setErr(null);
  }, [open]);

  const createMut = useMutation({
    mutationFn: async () => {
      if (!driver) throw new Error("Select a driver.");
      const n = parseFloat(principal);
      if (!Number.isFinite(n) || n <= 0) throw new Error("Principal must be a positive number.");
      const { data } = await postDriverLoan(driver.id, {
        principal: n,
        disbursed_at: disbursedAt.trim() || undefined,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
        planned_repayment_week: plannedWeek.trim() || null,
        planned_repayment_note: plannedNote.trim() || null,
      });
      return data;
    },
    onSuccess: (loan) => {
      onSuccess(loan.id);
      onClose();
    },
    onError: (e: unknown) => setErr(parseApiError(e)),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close"
        onClick={() => !createMut.isPending && onClose()}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/80 bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-ink">Create loan</h2>
        <p className="mt-1 text-sm text-ink-muted">Give a cash loan to a driver. One active loan per driver.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Driver *</label>
            <DriverSearchCombobox value={driver} onChange={setDriver} disabled={createMut.isPending} />
          </div>
          {err && <p className="text-xs text-red-700">{err}</p>}
          <input
            type="number"
            step="0.01"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm tabular-nums"
            placeholder="Principal (RON) *"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            disabled={createMut.isPending}
          />
          <input
            type="date"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={disbursedAt}
            onChange={(e) => setDisbursedAt(e.target.value)}
            disabled={createMut.isPending}
          />
          <input
            type="text"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Reference (optional)"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            disabled={createMut.isPending}
          />
          <textarea
            className="w-full rounded-lg border border-border px-3 py-2 text-sm min-h-[60px]"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={createMut.isPending}
          />
          <p className="text-xs font-medium text-ink-muted">Optional planned repayment</p>
          <input
            type="date"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={plannedWeek}
            onChange={(e) => setPlannedWeek(e.target.value)}
            disabled={createMut.isPending}
          />
          <input
            type="text"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Plan reminder note"
            value={plannedNote}
            onChange={(e) => setPlannedNote(e.target.value)}
            disabled={createMut.isPending}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={createMut.isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm text-ink-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={createMut.isPending || !driver}
            onClick={() => createMut.mutate()}
            className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {createMut.isPending ? "Creating…" : "Create loan"}
          </button>
        </div>
      </div>
    </div>
  );
}
