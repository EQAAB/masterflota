import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
  getFiscalProfile,
  saveFiscalProfile,
  getInvoiceSeries,
  createInvoiceSeries,
  updateInvoiceSeries,
  getAnafConnectionStatus,
  initiateAnafConnection,
  disconnectAnaf,
  type FiscalProfileInput,
} from "../../api/invoicing";
import { useAnyPermission } from "../../lib/permissions";
import { dashboardPage, btnPrimary, btnSecondary } from "../../theme/classNames";

const INPUT_CLS = "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export function InvoicingSettingsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const canManage = useAnyPermission("invoicing.manage");
  const canAnaf = useAnyPermission("invoicing.anaf");
  const anafResult = searchParams.get("anaf");

  // Fiscal profile
  const profileQuery = useQuery({
    queryKey: ["invoicing", "fiscal-profile"],
    queryFn: () => getFiscalProfile().then((r) => r.data),
  });

  const [fp, setFp] = useState<FiscalProfileInput>({
    cui: "", companyName: "", regCom: "", isVatPayer: false, vatCode: "",
    addressCounty: "", addressCity: "", addressStreet: "", addressNumber: "", addressZip: "",
    bankName: "", bankIban: "", legalRepresentative: "", phone: "", email: "",
  });
  const [fpInitialized, setFpInitialized] = useState(false);

  if (profileQuery.data && !fpInitialized) {
    const p = profileQuery.data;
    setFp({
      cui: p.cui ?? "", companyName: p.company_name ?? "", regCom: p.reg_com ?? "",
      isVatPayer: p.is_vat_payer, vatCode: p.vat_code ?? "",
      addressCounty: p.address_county ?? "", addressCity: p.address_city ?? "",
      addressStreet: p.address_street ?? "", addressNumber: p.address_number ?? "",
      addressZip: p.address_zip ?? "", bankName: p.bank_name ?? "", bankIban: p.bank_iban ?? "",
      legalRepresentative: p.legal_representative ?? "", phone: p.phone ?? "", email: p.email ?? "",
    });
    setFpInitialized(true);
  }

  const saveFpMutation = useMutation({
    mutationFn: () => saveFiscalProfile(fp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoicing", "fiscal-profile"] });
      setFpInitialized(false);
    },
  });

  // Series
  const seriesQuery = useQuery({
    queryKey: ["invoicing", "series"],
    queryFn: () => getInvoiceSeries().then((r) => r.data),
  });

  const [newPrefix, setNewPrefix] = useState("");
  const [newStartNumber, setNewStartNumber] = useState(1);

  const createSeriesMutation = useMutation({
    mutationFn: () => createInvoiceSeries({ prefix: newPrefix, startNumber: newStartNumber, isDefault: !seriesQuery.data?.length }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoicing", "series"] });
      setNewPrefix("");
      setNewStartNumber(1);
    },
  });

  const toggleDefaultMutation = useMutation({
    mutationFn: (id: string) => updateInvoiceSeries(id, { isDefault: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing", "series"] }),
  });

  // ANAF
  const anafQuery = useQuery({
    queryKey: ["invoicing", "anaf-status"],
    queryFn: () => getAnafConnectionStatus().then((r) => r.data),
  });

  const connectAnafMutation = useMutation({
    mutationFn: () => initiateAnafConnection(),
    onSuccess: (resp) => {
      window.location.href = resp.data.authUrl;
    },
  });

  const disconnectAnafMutation = useMutation({
    mutationFn: () => disconnectAnaf(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing", "anaf-status"] }),
  });

  const patchFp = (field: keyof FiscalProfileInput, value: string | boolean) =>
    setFp((prev) => ({ ...prev, [field]: value }));

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
          <h1 className="text-2xl font-bold tracking-tight text-ink">Invoicing settings</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Configure your fiscal profile, invoice series, and ANAF connection.
          </p>
        </header>

        {anafResult === "connected" && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Successfully connected to ANAF e-Factura.
          </div>
        )}
        {anafResult === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            ANAF connection failed. {searchParams.get("message")}
          </div>
        )}

        <div className="space-y-8">
          {/* Fiscal profile */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">Fiscal profile (issuer)</h2>
            {profileQuery.isLoading ? (
              <p className="text-sm text-ink-muted">Loading...</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">CUI *</label>
                  <input value={fp.cui} onChange={(e) => patchFp("cui", e.target.value)} className={INPUT_CLS} placeholder="e.g. 12345678" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">Company name *</label>
                  <input value={fp.companyName} onChange={(e) => patchFp("companyName", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">Reg. Com.</label>
                  <input value={fp.regCom} onChange={(e) => patchFp("regCom", e.target.value)} className={INPUT_CLS} placeholder="J40/1234/2020" />
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input type="checkbox" checked={fp.isVatPayer} onChange={(e) => patchFp("isVatPayer", e.target.checked)} className="rounded" />
                    VAT payer (platitor TVA)
                  </label>
                </div>
                {fp.isVatPayer && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">VAT code</label>
                    <input value={fp.vatCode} onChange={(e) => patchFp("vatCode", e.target.value)} className={INPUT_CLS} placeholder="RO12345678" />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">County</label>
                  <input value={fp.addressCounty} onChange={(e) => patchFp("addressCounty", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">City</label>
                  <input value={fp.addressCity} onChange={(e) => patchFp("addressCity", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">Street</label>
                  <input value={fp.addressStreet} onChange={(e) => patchFp("addressStreet", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">Number</label>
                  <input value={fp.addressNumber} onChange={(e) => patchFp("addressNumber", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">ZIP code</label>
                  <input value={fp.addressZip} onChange={(e) => patchFp("addressZip", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">Bank name</label>
                  <input value={fp.bankName} onChange={(e) => patchFp("bankName", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">IBAN</label>
                  <input value={fp.bankIban} onChange={(e) => patchFp("bankIban", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">Legal representative</label>
                  <input value={fp.legalRepresentative} onChange={(e) => patchFp("legalRepresentative", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">Phone</label>
                  <input value={fp.phone} onChange={(e) => patchFp("phone", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">Email</label>
                  <input type="email" value={fp.email} onChange={(e) => patchFp("email", e.target.value)} className={INPUT_CLS} />
                </div>
              </div>
            )}
            {canManage && (
              <div className="mt-4 flex justify-end">
                <button
                  className={btnPrimary}
                  onClick={() => saveFpMutation.mutate()}
                  disabled={saveFpMutation.isPending}
                >
                  {saveFpMutation.isPending ? "Saving..." : "Save fiscal profile"}
                </button>
              </div>
            )}
            {saveFpMutation.isSuccess && (
              <p className="mt-2 text-right text-sm text-green-600">Saved successfully</p>
            )}
          </div>

          {/* Invoice series */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">Invoice series</h2>
            {seriesQuery.data?.length ? (
              <div className="mb-4 space-y-2">
                {seriesQuery.data.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 rounded-lg border border-border/50 bg-surface p-3">
                    <span className="font-mono font-semibold text-ink">{s.prefix}</span>
                    <span className="text-sm text-ink-muted">Next: {s.next_number}</span>
                    <span className={`text-xs ${s.is_active ? "text-green-600" : "text-gray-400"}`}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                    {s.is_default && (
                      <span className="rounded bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">Default</span>
                    )}
                    {!s.is_default && canManage && (
                      <button
                        className="text-xs text-brand hover:underline"
                        onClick={() => toggleDefaultMutation.mutate(s.id)}
                      >
                        Set as default
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-4 text-sm text-ink-muted">No series configured. Create one to start issuing invoices.</p>
            )}
            {canManage && (
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">Prefix</label>
                  <input value={newPrefix} onChange={(e) => setNewPrefix(e.target.value.toUpperCase())} className={`${INPUT_CLS} w-24`} placeholder="FV" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">Start number</label>
                  <input type="number" min={1} value={newStartNumber} onChange={(e) => setNewStartNumber(parseInt(e.target.value) || 1)} className={`${INPUT_CLS} w-24`} />
                </div>
                <button
                  className={btnPrimary}
                  onClick={() => createSeriesMutation.mutate()}
                  disabled={createSeriesMutation.isPending || !newPrefix.trim()}
                >
                  Add series
                </button>
              </div>
            )}
          </div>

          {/* ANAF connection */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">ANAF e-Factura</h2>
            {anafQuery.isLoading ? (
              <p className="text-sm text-ink-muted">Checking connection...</p>
            ) : anafQuery.data?.connected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-700">Connected to ANAF</span>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-ink-muted">CUI</dt>
                  <dd className="text-ink">{anafQuery.data.cui}</dd>
                  <dt className="text-ink-muted">Connected at</dt>
                  <dd className="text-ink">{anafQuery.data.connectedAt ? new Date(anafQuery.data.connectedAt).toLocaleString("ro-RO") : "–"}</dd>
                  <dt className="text-ink-muted">Token expires</dt>
                  <dd className="text-ink">{anafQuery.data.expiresAt ? new Date(anafQuery.data.expiresAt).toLocaleString("ro-RO") : "–"}</dd>
                </dl>
                {canAnaf && (
                  <button
                    className={`${btnSecondary} !text-red-600`}
                    onClick={() => disconnectAnafMutation.mutate()}
                    disabled={disconnectAnafMutation.isPending}
                  >
                    Disconnect
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                  <span className="text-sm text-ink-muted">Not connected</span>
                </div>
                <p className="text-sm text-ink-muted">
                  Connect your organization to ANAF e-Factura to submit invoices electronically.
                  You will need a qualified digital certificate installed in your browser.
                </p>
                {canAnaf && (
                  <button
                    className={btnPrimary}
                    onClick={() => connectAnafMutation.mutate()}
                    disabled={connectAnafMutation.isPending}
                  >
                    {connectAnafMutation.isPending ? "Redirecting..." : "Connect to ANAF"}
                  </button>
                )}
                {connectAnafMutation.error && (
                  <p className="text-sm text-red-600">{(connectAnafMutation.error as Error)?.message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
