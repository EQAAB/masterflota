import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createInvoice, getInvoiceSeries, type InvoiceLineInput } from "../../api/invoicing";
import { dashboardPage, btnPrimary, btnSecondary } from "../../theme/classNames";

const EMPTY_LINE: InvoiceLineInput = { description: "", quantity: 1, unit: "buc", unitPrice: 0, vatRate: 19 };

const INPUT_CLS = "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export function InvoiceFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId") ?? undefined;
  const prefillBuyer = searchParams.get("buyerName") ?? "";

  const seriesQuery = useQuery({
    queryKey: ["invoicing", "series"],
    queryFn: () => getInvoiceSeries().then((r) => r.data),
  });

  const [form, setForm] = useState({
    seriesId: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    deliveryDate: "",
    buyerName: prefillBuyer,
    buyerCui: "",
    buyerRegCom: "",
    buyerAddressCounty: "",
    buyerAddressCity: "",
    buyerAddressStreet: "",
    buyerAddressNumber: "",
    buyerAddressZip: "",
    buyerIsVatPayer: false,
    buyerEmail: "",
    buyerPhone: "",
    buyerBankName: "",
    buyerBankIban: "",
    currency: "RON",
    notes: "",
  });

  const [lines, setLines] = useState<InvoiceLineInput[]>([{ ...EMPTY_LINE }]);

  const series = seriesQuery.data ?? [];
  const defaultSeries = series.find((s) => s.is_default) ?? series[0];

  if (!form.seriesId && defaultSeries) {
    setForm((f) => ({ ...f, seriesId: defaultSeries.id }));
  }

  const updateLine = (idx: number, patch: Partial<InvoiceLineInput>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE }]);

  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const computeLineNet = (l: InvoiceLineInput) => l.quantity * l.unitPrice;
  const computeLineVat = (l: InvoiceLineInput) => computeLineNet(l) * (l.vatRate / 100);

  const totalNet = lines.reduce((s, l) => s + computeLineNet(l), 0);
  const totalVat = lines.reduce((s, l) => s + computeLineVat(l), 0);
  const totalAmount = totalNet + totalVat;

  const createMutation = useMutation({
    mutationFn: () =>
      createInvoice({
        seriesId: form.seriesId,
        issueDate: form.issueDate,
        dueDate: form.dueDate || undefined,
        deliveryDate: form.deliveryDate || undefined,
        buyerName: form.buyerName,
        buyerCui: form.buyerCui || undefined,
        buyerRegCom: form.buyerRegCom || undefined,
        buyerAddressCounty: form.buyerAddressCounty || undefined,
        buyerAddressCity: form.buyerAddressCity || undefined,
        buyerAddressStreet: form.buyerAddressStreet || undefined,
        buyerAddressNumber: form.buyerAddressNumber || undefined,
        buyerAddressZip: form.buyerAddressZip || undefined,
        buyerIsVatPayer: form.buyerIsVatPayer,
        buyerEmail: form.buyerEmail || undefined,
        buyerPhone: form.buyerPhone || undefined,
        buyerBankName: form.buyerBankName || undefined,
        buyerBankIban: form.buyerBankIban || undefined,
        currency: form.currency,
        notes: form.notes || undefined,
        sourceType: bookingId ? "rental" : undefined,
        rentalBookingId: bookingId,
        lines,
      }),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ["invoicing"] });
      navigate(`/invoicing/${resp.data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.buyerName.trim()) return;
    if (lines.some((l) => !l.description.trim())) return;
    createMutation.mutate();
  };

  const patch = (field: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated">
      <div className={dashboardPage}>
        <header className="mb-6">
          <Link
            to="/invoicing"
            className={`${btnSecondary} !mb-3 !inline-flex !min-h-0 !px-3 !py-1.5 !text-xs`}
          >
            ← Invoices
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-ink">New invoice</h1>
        </header>

        {createMutation.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {(createMutation.error as Error)?.message ?? "Failed to create invoice"}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Series & dates */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">Invoice details</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Series</label>
                <select
                  value={form.seriesId}
                  onChange={(e) => patch("seriesId", e.target.value)}
                  className={INPUT_CLS}
                  required
                >
                  {series.filter((s) => s.is_active).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.prefix} (next: {s.next_number})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Issue date</label>
                <input type="date" value={form.issueDate} onChange={(e) => patch("issueDate", e.target.value)} className={INPUT_CLS} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Due date</label>
                <input type="date" value={form.dueDate} onChange={(e) => patch("dueDate", e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Delivery date</label>
                <input type="date" value={form.deliveryDate} onChange={(e) => patch("deliveryDate", e.target.value)} className={INPUT_CLS} />
              </div>
            </div>
          </div>

          {/* Buyer */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">Buyer</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Company / Name *</label>
                <input value={form.buyerName} onChange={(e) => patch("buyerName", e.target.value)} className={INPUT_CLS} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">CUI</label>
                <input value={form.buyerCui} onChange={(e) => patch("buyerCui", e.target.value)} className={INPUT_CLS} placeholder="e.g. RO12345678" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Reg. Com.</label>
                <input value={form.buyerRegCom} onChange={(e) => patch("buyerRegCom", e.target.value)} className={INPUT_CLS} placeholder="J40/1234/2020" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">County</label>
                <input value={form.buyerAddressCounty} onChange={(e) => patch("buyerAddressCounty", e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">City</label>
                <input value={form.buyerAddressCity} onChange={(e) => patch("buyerAddressCity", e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Street</label>
                <input value={form.buyerAddressStreet} onChange={(e) => patch("buyerAddressStreet", e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Number</label>
                <input value={form.buyerAddressNumber} onChange={(e) => patch("buyerAddressNumber", e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">ZIP</label>
                <input value={form.buyerAddressZip} onChange={(e) => patch("buyerAddressZip", e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Email</label>
                <input type="email" value={form.buyerEmail} onChange={(e) => patch("buyerEmail", e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Phone</label>
                <input value={form.buyerPhone} onChange={(e) => patch("buyerPhone", e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Bank name</label>
                <input value={form.buyerBankName} onChange={(e) => patch("buyerBankName", e.target.value)} className={INPUT_CLS} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">IBAN</label>
                <input value={form.buyerBankIban} onChange={(e) => patch("buyerBankIban", e.target.value)} className={INPUT_CLS} />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={form.buyerIsVatPayer} onChange={(e) => patch("buyerIsVatPayer", e.target.checked)} className="rounded" />
                  VAT payer
                </label>
              </div>
            </div>
          </div>

          {/* Lines */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Line items</h2>
              <button type="button" onClick={addLine} className={`${btnSecondary} !text-xs`}>
                + Add line
              </button>
            </div>
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={idx} className="grid items-end gap-3 rounded-lg border border-border/50 bg-surface p-3 sm:grid-cols-[2fr_80px_80px_100px_80px_40px]">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">Description</label>
                    <input value={line.description} onChange={(e) => updateLine(idx, { description: e.target.value })} className={INPUT_CLS} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">Qty</label>
                    <input type="number" step="0.01" min="0" value={line.quantity} onChange={(e) => updateLine(idx, { quantity: parseFloat(e.target.value) || 0 })} className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">Unit</label>
                    <input value={line.unit ?? "buc"} onChange={(e) => updateLine(idx, { unit: e.target.value })} className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">Unit price</label>
                    <input type="number" step="0.01" min="0" value={line.unitPrice} onChange={(e) => updateLine(idx, { unitPrice: parseFloat(e.target.value) || 0 })} className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">VAT %</label>
                    <select value={line.vatRate} onChange={(e) => updateLine(idx, { vatRate: parseFloat(e.target.value) })} className={INPUT_CLS}>
                      <option value={19}>19%</option>
                      <option value={9}>9%</option>
                      <option value={5}>5%</option>
                      <option value={0}>0%</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="rounded p-2 text-ink-muted hover:bg-red-50 hover:text-red-600"
                      title="Remove line"
                      disabled={lines.length <= 1}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <div className="space-y-1 text-right text-sm">
                <p className="text-ink-muted">Net: <span className="font-medium text-ink">{totalNet.toFixed(2)} {form.currency}</span></p>
                <p className="text-ink-muted">VAT: <span className="font-medium text-ink">{totalVat.toFixed(2)} {form.currency}</span></p>
                <p className="text-lg font-bold text-ink">Total: {totalAmount.toFixed(2)} {form.currency}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-card">
            <label className="mb-1 block text-xs font-medium text-ink-muted">Notes</label>
            <textarea value={form.notes} onChange={(e) => patch("notes", e.target.value)} rows={3} className={INPUT_CLS} />
          </div>

          <div className="flex justify-end gap-3">
            <Link to="/invoicing" className={btnSecondary}>Cancel</Link>
            <button type="submit" className={btnPrimary} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
