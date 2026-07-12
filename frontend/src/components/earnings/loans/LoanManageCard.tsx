import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  loanStatusLabel,
  patchDriverLoanPlan,
  postLoanRepayment,
  type DriverLoan,
} from "../../../api/driverLoans";
import { formatCurrency } from "../../../utils/currency";

type LoanManageCardProps = {
  loan: DriverLoan;
  driverId: string;
  canEdit: boolean;
  onChanged: () => void;
};

export function LoanManageCard({ loan, driverId, canEdit, onChanged }: LoanManageCardProps) {
  const [repayOpen, setRepayOpen] = useState(false);
  const [repayType, setRepayType] = useState<"cash" | "forgive">("cash");
  const [repayAmount, setRepayAmount] = useState("");
  const [repayNotes, setRepayNotes] = useState("");
  const [planOpen, setPlanOpen] = useState(false);
  const [plannedWeek, setPlannedWeek] = useState(loan.planned_repayment_week?.slice(0, 10) ?? "");
  const [plannedNote, setPlannedNote] = useState(loan.planned_repayment_note ?? "");
  const [err, setErr] = useState<string | null>(null);

  const repayMut = useMutation({
    mutationFn: async (opts: { settle_full?: boolean }) => {
      const body: Parameters<typeof postLoanRepayment>[2] = {
        type: repayType,
        notes: repayNotes.trim() || null,
        settle_full: opts.settle_full,
      };
      if (!opts.settle_full) {
        const n = parseFloat(repayAmount);
        if (!Number.isFinite(n) || n <= 0) throw new Error("Enter a positive amount.");
        body.amount = n;
      }
      return postLoanRepayment(driverId, loan.id, body);
    },
    onSuccess: () => {
      setRepayOpen(false);
      setRepayAmount("");
      setRepayNotes("");
      setErr(null);
      onChanged();
    },
    onError: (e: Error) => setErr(e.message),
  });

  const planMut = useMutation({
    mutationFn: () =>
      patchDriverLoanPlan(driverId, loan.id, {
        planned_repayment_week: plannedWeek.trim() || null,
        planned_repayment_note: plannedNote.trim() || null,
      }),
    onSuccess: () => {
      setPlanOpen(false);
      onChanged();
    },
    onError: (e: Error) => setErr(e.message),
  });

  const isActive = loan.status === "active" && Number(loan.remaining_balance) > 0.02;

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-white shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3 bg-slate-50/80 px-4 py-4 border-b border-border/60">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink text-lg">
              {loan.reference?.trim() || "Cash loan"}
            </span>
            <span className="text-xs font-medium text-ink-muted">{loanStatusLabel(loan.status)}</span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">Disbursed {loan.disbursed_at.slice(0, 10)}</p>
          <div className="mt-2 tabular-nums text-sm">
            <span className="text-ink-muted">Principal </span>
            <span className="font-medium">{formatCurrency(Number(loan.principal))}</span>
            <span className="mx-2 text-slate-300">·</span>
            <span className="text-ink-muted">Remaining </span>
            <span className={`font-semibold ${isActive ? "text-sky-800" : "text-emerald-800"}`}>
              {formatCurrency(Number(loan.remaining_balance))}
            </span>
          </div>
          {loan.planned_repayment_week && (
            <p className="text-xs text-sky-800 mt-1">
              Planned week: {loan.planned_repayment_week.slice(0, 10)}
              {loan.planned_repayment_note?.trim() ? ` — ${loan.planned_repayment_note.trim()}` : ""}
            </p>
          )}
          {loan.notes && <p className="text-xs text-ink-muted mt-1">{loan.notes}</p>}
        </div>
        {canEdit && isActive && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setRepayType("cash");
                setRepayOpen(true);
                setErr(null);
              }}
              className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 text-xs font-medium text-ink hover:bg-white"
            >
              Record cash
            </button>
            <button
              type="button"
              onClick={() => {
                setRepayType("forgive");
                setRepayOpen(true);
                setErr(null);
              }}
              className="inline-flex h-8 items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
            >
              Forgive
            </button>
            <button
              type="button"
              onClick={() => {
                setPlannedWeek(loan.planned_repayment_week?.slice(0, 10) ?? "");
                setPlannedNote(loan.planned_repayment_note ?? "");
                setPlanOpen(true);
                setErr(null);
              }}
              className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 text-xs font-medium text-ink hover:bg-white"
            >
              Plan week
            </button>
          </div>
        )}
      </div>

      {repayOpen && (
        <div className="border-t border-border/60 bg-white px-4 py-3 space-y-2">
          <p className="text-sm font-medium text-ink">
            {repayType === "cash" ? "Record cash / bank repayment" : "Forgive / write-off"}
          </p>
          {err && <p className="text-xs text-red-700">{err}</p>}
          <input
            type="number"
            step="0.01"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm tabular-nums"
            placeholder="Amount (RON)"
            value={repayAmount}
            onChange={(e) => setRepayAmount(e.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-border px-3 py-2 text-sm min-h-[60px]"
            placeholder="Note (optional)"
            value={repayNotes}
            onChange={(e) => setRepayNotes(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={repayMut.isPending}
              onClick={() => repayMut.mutate({})}
              className="rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-medium text-white"
            >
              Apply amount
            </button>
            <button
              type="button"
              disabled={repayMut.isPending}
              onClick={() => repayMut.mutate({ settle_full: true })}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink"
            >
              {repayType === "forgive" ? "Write off full balance" : "Full cash settlement"}
            </button>
            <button type="button" onClick={() => setRepayOpen(false)} className="text-xs text-ink-muted px-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {planOpen && (
        <div className="border-t border-border/60 bg-white px-4 py-3 space-y-2">
          <p className="text-sm font-medium text-ink">Planned repayment (reminder only)</p>
          {err && <p className="text-xs text-red-700">{err}</p>}
          <label className="block text-xs text-ink-muted">Week start (Monday)</label>
          <input
            type="date"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={plannedWeek}
            onChange={(e) => setPlannedWeek(e.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-border px-3 py-2 text-sm min-h-[60px]"
            placeholder="Reminder note"
            value={plannedNote}
            onChange={(e) => setPlannedNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={planMut.isPending}
              onClick={() => planMut.mutate()}
              className="rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-medium text-white"
            >
              Save plan
            </button>
            <button type="button" onClick={() => setPlanOpen(false)} className="text-xs text-ink-muted px-2">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
