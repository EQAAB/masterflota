import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDriverLoans,
  loanRepaymentTypeLabel,
  loanStatusLabel,
  patchDriverLoanPlan,
  postDriverLoan,
  postLoanRepayment,
  type DriverLoan,
  type DriverLoanRepayment,
} from "../../api/driverLoans";
import { formatCurrency } from "../../utils/currency";

type DriverLoansPanelProps = {
  driverId: string;
  canEdit: boolean;
};

function RepaymentRow({ r }: { r: DriverLoanRepayment }) {
  return (
    <li className="flex flex-wrap justify-between gap-2 border-b border-border/60 px-3 py-2.5 last:border-0 bg-white text-sm">
      <div>
        <span className="font-medium text-ink">{loanRepaymentTypeLabel(r.repayment_type)}</span>
        {r.payment_period_start && r.payment_period_end && (
          <span className="ml-2 text-xs text-ink-muted">
            {r.payment_period_start.slice(0, 10)} – {r.payment_period_end.slice(0, 10)}
          </span>
        )}
        <div className="text-ink tabular-nums mt-0.5">−{formatCurrency(Number(r.amount))}</div>
        <p className="text-xs text-ink-muted mt-0.5">
          Balance {formatCurrency(Number(r.balance_before))} → {formatCurrency(Number(r.balance_after))}
        </p>
        {r.notes && <p className="text-xs text-ink-muted">{r.notes}</p>}
      </div>
      <time className="text-xs text-ink-muted shrink-0">{r.created_at.slice(0, 10)}</time>
    </li>
  );
}

function LoanCard({ loan, canEdit, driverId, onChanged }: {
  loan: DriverLoan;
  canEdit: boolean;
  driverId: string;
  onChanged: () => void;
}) {
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
    <div className="overflow-hidden rounded-xl border border-border/70">
      <div className="flex flex-wrap items-start justify-between gap-3 bg-slate-50/80 px-3 py-3 border-b border-border/60">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">
              {loan.reference?.trim() || "Cash loan"}
            </span>
            <span className="text-xs font-medium text-ink-muted">{loanStatusLabel(loan.status)}</span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Disbursed {loan.disbursed_at.slice(0, 10)}
          </p>
          <div className="mt-1 tabular-nums text-sm">
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
              onClick={() => { setRepayType("cash"); setRepayOpen(true); setErr(null); }}
              className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 text-xs font-medium text-ink hover:bg-white"
            >
              Record cash
            </button>
            <button
              type="button"
              onClick={() => { setRepayType("forgive"); setRepayOpen(true); setErr(null); }}
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

      {loan.repayments && loan.repayments.length > 0 && (
        <ul>
          {loan.repayments.map((r) => (
            <RepaymentRow key={r.id} r={r} />
          ))}
        </ul>
      )}

      {repayOpen && (
        <div className="border-t border-border/60 bg-white px-3 py-3 space-y-2">
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
            <button
              type="button"
              onClick={() => setRepayOpen(false)}
              className="text-xs text-ink-muted px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {planOpen && (
        <div className="border-t border-border/60 bg-white px-3 py-3 space-y-2">
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

export function DriverLoansPanel({ driverId, canEdit }: DriverLoansPanelProps) {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [principal, setPrincipal] = useState("");
  const [disbursedAt, setDisbursedAt] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [plannedWeek, setPlannedWeek] = useState("");
  const [plannedNote, setPlannedNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["driver-loans", driverId],
    queryFn: () => getDriverLoans(driverId).then((r) => r.data.items),
    enabled: !!driverId,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["driver-loans", driverId] });
    void qc.invalidateQueries({ queryKey: ["drivers", "loans", "summary"] });
    void qc.invalidateQueries({ queryKey: ["earnings"] });
  };

  const activeLoan = q.data?.find((l) => l.status === "active" && Number(l.remaining_balance) > 0.02);

  const createMut = useMutation({
    mutationFn: async () => {
      const n = parseFloat(principal);
      if (!Number.isFinite(n) || n <= 0) throw new Error("Principal must be a positive number.");
      return postDriverLoan(driverId, {
        principal: n,
        disbursed_at: disbursedAt.trim() || undefined,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
        planned_repayment_week: plannedWeek.trim() || null,
        planned_repayment_note: plannedNote.trim() || null,
      });
    },
    onSuccess: () => {
      setCreateOpen(false);
      setPrincipal("");
      setDisbursedAt("");
      setReference("");
      setNotes("");
      setPlannedWeek("");
      setPlannedNote("");
      setErr(null);
      invalidate();
    },
    onError: (e: unknown) => {
      const msg =
        e && typeof e === "object" && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed")
          : e instanceof Error
            ? e.message
            : "Failed";
      setErr(msg);
    },
  });

  return (
    <section className="rounded-[16px] border border-border/70 bg-white p-4 shadow-soft sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-ink">Loans</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Cash loans with flexible repayments — take from a payout week, record cash, or forgive.
            Separate from platform bad-week debt.
          </p>
        </div>
        {canEdit && !activeLoan && (
          <button
            type="button"
            onClick={() => { setCreateOpen(true); setErr(null); }}
            className="inline-flex h-9 items-center rounded-lg bg-brand-gradient px-3.5 text-sm font-medium text-white hover:opacity-95"
          >
            Create loan
          </button>
        )}
      </div>

      {q.isLoading && <p className="text-sm text-ink-muted">Loading…</p>}
      {q.isError && <p className="text-sm text-red-700">Failed to load loans.</p>}

      {q.data && q.data.length === 0 && !createOpen && (
        <p className="text-sm text-ink-muted">No loans recorded for this driver.</p>
      )}

      {q.data && q.data.length > 0 && (
        <div className="space-y-3">
          {q.data.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              canEdit={canEdit}
              driverId={driverId}
              onChanged={invalidate}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <div className="mt-3 rounded-xl border border-border/70 bg-slate-50/50 p-3 space-y-2">
          <p className="text-sm font-medium text-ink">New loan</p>
          {err && <p className="text-xs text-red-700">{err}</p>}
          <input
            type="number"
            step="0.01"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm tabular-nums"
            placeholder="Principal (RON) *"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
          />
          <input
            type="date"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={disbursedAt}
            onChange={(e) => setDisbursedAt(e.target.value)}
          />
          <input
            type="text"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Reference (optional)"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-border px-3 py-2 text-sm min-h-[60px]"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p className="text-xs font-medium text-ink-muted pt-1">Optional planned repayment</p>
          <input
            type="date"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={plannedWeek}
            onChange={(e) => setPlannedWeek(e.target.value)}
          />
          <input
            type="text"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Plan reminder note"
            value={plannedNote}
            onChange={(e) => setPlannedNote(e.target.value)}
          />
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={createMut.isPending}
              onClick={() => createMut.mutate()}
              className="rounded-lg bg-brand-gradient px-3 py-1.5 text-sm font-medium text-white"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="text-sm text-ink-muted px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
