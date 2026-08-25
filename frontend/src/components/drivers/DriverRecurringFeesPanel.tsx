import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  deleteDriverRecurringFee,
  getDriverRecurringFees,
  patchDriverRecurringFee,
  postDriverRecurringFee,
  recurringFeeFrequencyLabel,
  type DriverRecurringFee,
  type RecurringFeeFrequency,
} from "../../api/driverRecurringFees";
import type { CustomFeeType } from "../../api/earnings";
import { formatCurrency } from "../../utils/currency";

type DriverRecurringFeesPanelProps = {
  driverId: string;
  canEdit: boolean;
};

function FeeRowList({ items }: { items: DriverRecurringFee[] }) {
  const { t } = useTranslation();
  if (!items.length) {
    return <p className="text-sm text-ink-muted">{t("pages.driverDetail.noRecurringFeesConfigured")}</p>;
  }
  return (
    <ul className="overflow-hidden rounded-xl border border-border/70 text-sm">
      {items.map((f) => (
        <li
          key={f.id}
          className={`flex flex-wrap justify-between gap-2 border-b border-border/60 px-3 py-2.5 last:border-0 ${!f.is_active ? "bg-slate-50 opacity-70" : "bg-white"}`}
        >
          <div>
            <span className="font-medium text-ink">{f.fee_name}</span>
            <span
              className={`ml-2 text-xs font-medium ${
                f.fee_type === "deduction" ? "text-rose-700" : "text-emerald-700"
              }`}
            >
              {f.fee_type === "deduction" ? t("pages.driverDetail.deductionLabel") : t("pages.driverDetail.additionLabel")}
            </span>
            {!f.is_active && (
              <span className="ml-2 text-xs text-ink-muted">{t("pages.driverDetail.pausedSuffix")}</span>
            )}
            <span className="ml-2 text-xs text-ink-muted">
              {recurringFeeFrequencyLabel(f.frequency ?? "weekly")}
            </span>
            <div className="text-ink tabular-nums mt-0.5">
              {f.fee_type === "deduction" ? "−" : "+"}
              {formatCurrency(Number(f.amount))}
            </div>
            {(f.start_date || f.end_date) && (
              <p className="text-xs text-ink-muted mt-0.5">
                {f.start_date ?? "…"} → {f.end_date ?? "…"}
              </p>
            )}
            {f.notes && <p className="text-xs text-ink-muted">{f.notes}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DriverRecurringFeesPanel({ driverId, canEdit }: DriverRecurringFeesPanelProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DriverRecurringFee | null>(null);
  const [feeName, setFeeName] = useState("");
  const [feeType, setFeeType] = useState<CustomFeeType>("deduction");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [frequency, setFrequency] = useState<RecurringFeeFrequency>("weekly");
  const [err, setErr] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["driver-recurring-fees", driverId],
    queryFn: () => getDriverRecurringFees(driverId).then((r) => r.data.items),
    enabled: !!driverId,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["driver-recurring-fees", driverId] });
    void qc.invalidateQueries({ queryKey: ["earnings"] });
  };

  const openCreate = () => {
    setEditing(null);
    setFeeName("");
    setFeeType("deduction");
    setAmount("");
    setStartDate("");
    setEndDate("");
    setNotes("");
    setIsActive(true);
    setFrequency("weekly");
    setErr(null);
    setModalOpen(true);
  };

  const openEdit = (f: DriverRecurringFee) => {
    setEditing(f);
    setFeeName(f.fee_name);
    setFeeType(f.fee_type);
    setAmount(String(f.amount));
    setStartDate(f.start_date ?? "");
    setEndDate(f.end_date ?? "");
    setNotes(f.notes ?? "");
    setIsActive(f.is_active);
    setFrequency(f.frequency ?? "weekly");
    setErr(null);
    setModalOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const amountNum = parseFloat(amount);
      if (!feeName.trim() || !Number.isFinite(amountNum) || amountNum < 0) {
        throw new Error(t("pages.driverDetail.nameAmountRequiredError"));
      }
      const body = {
        fee_name: feeName.trim(),
        fee_type: feeType,
        amount: amountNum,
        frequency,
        is_active: isActive,
        start_date: startDate.trim() || null,
        end_date: endDate.trim() || null,
        notes: notes.trim() || null,
      };
      if (editing) {
        return patchDriverRecurringFee(driverId, editing.id, body);
      }
      return postDriverRecurringFee(driverId, body);
    },
    onSuccess: () => {
      setModalOpen(false);
      invalidate();
    },
    onError: (e: Error) => setErr(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (f: DriverRecurringFee) =>
      patchDriverRecurringFee(driverId, f.id, { is_active: !f.is_active }),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (feeId: string) => deleteDriverRecurringFee(driverId, feeId),
    onSuccess: invalidate,
  });

  return (
    <section className="rounded-[16px] border border-border/70 bg-white p-4 shadow-soft sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-ink">{t("pages.driverDetail.recurringFeesTitle")}</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            {t("pages.driverDetail.recurringFeesDesc")}
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-9 items-center rounded-lg bg-brand-gradient px-3.5 text-sm font-medium text-white hover:opacity-95"
          >
            {t("pages.driverDetail.addRecurringFeeButton")}
          </button>
        )}
      </div>

      {q.isLoading && <p className="text-sm text-ink-muted">{t("common.loading")}</p>}
      {q.isError && <p className="text-sm text-red-700">{t("pages.driverDetail.failedToLoadRecurringFees")}</p>}
      {q.data && (
        <>
          <FeeRowList items={q.data} />
          {canEdit && q.data.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {q.data.map((f) => (
                <span key={f.id} className="inline-flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(f)}
                    className="text-xs text-brand hover:underline"
                  >
                    {t("pages.driverDetail.editFeePrefix", { feeName: f.fee_name })}
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => toggleMut.mutate(f)}
                    disabled={toggleMut.isPending}
                    className="text-xs text-ink-muted hover:underline disabled:opacity-50"
                  >
                    {f.is_active ? t("pages.driverDetail.pauseButton") : t("pages.driverDetail.enableButton")}
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t("pages.driverDetail.deleteRecurringFeeConfirm", { feeName: f.fee_name }))) {
                        deleteMut.mutate(f.id);
                      }
                    }}
                    disabled={deleteMut.isPending}
                    className="text-xs text-rose-700 hover:underline disabled:opacity-50"
                  >
                    {t("common.delete")}
                  </button>
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          onClick={() => !saveMut.isPending && setModalOpen(false)}
        >
          <div
            className="w-full max-w-md space-y-3 rounded-[14px] border border-border bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-ink">
              {editing ? t("pages.driverDetail.editRecurringFeeTitle") : t("pages.driverDetail.addRecurringFeeButton")}
            </h3>
            {err && <p className="text-sm text-red-700">{err}</p>}
            <div>
              <label className="block text-xs text-ink-muted mb-1">{t("pages.driverDetail.feeNameLabel")}</label>
              <input
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
                value={feeName}
                maxLength={100}
                onChange={(e) => setFeeName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink-muted mb-1">{t("pages.driverDetail.typeLabel")}</label>
                <select
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                  value={feeType}
                  onChange={(e) => setFeeType(e.target.value as CustomFeeType)}
                >
                  <option value="deduction">{t("pages.driverDetail.deductionLabel")}</option>
                  <option value="addition">{t("pages.driverDetail.additionLabel")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1">{t("pages.driverDetail.amountRonLabel")}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">{t("pages.driverDetail.frequencyLabel")}</label>
              <select
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFeeFrequency)}
              >
                <option value="weekly">{t("pages.driverDetail.weeklyOption")}</option>
                <option value="monthly_first_week">{t("pages.driverDetail.monthlyFirstWeekOption")}</option>
              </select>
              {frequency === "monthly_first_week" && (
                <p className="text-xs text-ink-muted mt-1">
                  {t("pages.driverDetail.monthlyFirstWeekHint")}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink-muted mb-1">{t("pages.driverDetail.startDateOptionalLabel")}</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1">{t("pages.driverDetail.endDateOptionalLabel")}</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              {t("pages.driverDetail.activeApplyLabel")}
            </label>
            <div>
              <label className="block text-xs text-ink-muted mb-1">{t("pages.invoiceDetail.notesLabel")}</label>
              <textarea
                rows={2}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="rounded-md border border-border px-3 py-1.5 text-sm"
                onClick={() => setModalOpen(false)}
                disabled={saveMut.isPending}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="rounded-md bg-brand-gradient px-3 py-1.5 text-sm text-white hover:opacity-95 disabled:opacity-50"
                disabled={saveMut.isPending}
                onClick={() => {
                  setErr(null);
                  saveMut.mutate();
                }}
              >
                {saveMut.isPending ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
