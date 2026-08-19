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
  uploadAnafCertificate,
  deleteAnafCertificate,
  connectProvider,
  disconnectProvider,
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

          {/* ANAF connection — active status */}
          {anafQuery.data?.connected && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-700">Connected to ANAF e-Factura</span>
                {anafQuery.data.connectionMethod && (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    via {anafQuery.data.connectionMethod}
                  </span>
                )}
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
                  className={`${btnSecondary} !text-red-600 mt-3`}
                  onClick={() => disconnectAnafMutation.mutate()}
                  disabled={disconnectAnafMutation.isPending}
                >
                  Disconnect
                </button>
              )}
            </div>
          )}

          {/* Connection options */}
          <AnafConnectionOptions
            anafData={anafQuery.data}
            anafLoading={anafQuery.isLoading}
            canAnaf={canAnaf}
            connectAnafMutation={connectAnafMutation}
            queryClient={queryClient}
          />
        </div>
      </div>
    </div>
  );
}

function AnafConnectionOptions({ anafData, anafLoading, canAnaf, connectAnafMutation, queryClient }: any) {
  const [activeTab, setActiveTab] = useState<"certificate" | "oauth" | "provider">("certificate");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState("");
  const [providerType, setProviderType] = useState("smartbill");
  const [providerApiKey, setProviderApiKey] = useState("");
  const [providerApiSecret, setProviderApiSecret] = useState("");
  const [providerCui, setProviderCui] = useState("");

  const uploadCertMutation = useMutation({
    mutationFn: () => {
      if (!certFile) throw new Error("Select a certificate file");
      return uploadAnafCertificate(certFile, certPassword);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoicing", "anaf-status"] });
      setCertFile(null);
      setCertPassword("");
    },
  });

  const deleteCertMutation = useMutation({
    mutationFn: () => deleteAnafCertificate(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing", "anaf-status"] }),
  });

  const connectProviderMutation = useMutation({
    mutationFn: () => connectProvider({
      provider: providerType,
      apiKey: providerApiKey,
      apiSecret: providerApiSecret || undefined,
      companyCui: providerCui || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoicing", "anaf-status"] });
      setProviderApiKey("");
      setProviderApiSecret("");
    },
  });

  const disconnectProviderMutation = useMutation({
    mutationFn: () => disconnectProvider(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoicing", "anaf-status"] }),
  });

  if (anafLoading) {
    return (
      <div className="rounded-xl border border-border bg-white p-5 shadow-card">
        <p className="text-sm text-ink-muted">Checking connection...</p>
      </div>
    );
  }

  const tabs = [
    { id: "certificate" as const, label: "Upload Certificate", desc: "Recommended" },
    { id: "provider" as const, label: "SmartBill / Oblio", desc: "Provider API" },
    { id: "oauth" as const, label: "Browser Login", desc: "Advanced" },
  ];

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-card">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">ANAF e-Factura connection</h2>
      <p className="mb-4 text-sm text-ink-muted">Choose how to connect to ANAF for submitting invoices electronically.</p>

      {/* Tab bar */}
      <div className="mb-5 flex gap-1 rounded-lg border border-border bg-surface p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-ink shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <span className="block">{tab.label}</span>
            <span className="block text-[10px] font-normal opacity-60">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* Certificate tab */}
      {activeTab === "certificate" && (
        <div className="space-y-4">
          {anafData?.certificate?.uploaded ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-700">Certificate uploaded</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-ink-muted">File</dt>
                <dd className="text-ink">{anafData.certificate.subject}</dd>
                <dt className="text-ink-muted">Uploaded</dt>
                <dd className="text-ink">{anafData.certificate.uploadedAt ? new Date(anafData.certificate.uploadedAt).toLocaleString("ro-RO") : "–"}</dd>
              </dl>
              {canAnaf && (
                <button
                  className={`${btnSecondary} !text-red-600`}
                  onClick={() => deleteCertMutation.mutate()}
                  disabled={deleteCertMutation.isPending}
                >
                  Remove certificate
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-sm text-blue-800 font-medium">Easiest way to connect</p>
                <p className="mt-1 text-xs text-blue-700">
                  Upload your company's digital certificate (.pfx or .p12 file) and its password.
                  The certificate is stored securely on the server — no browser certificate installation needed.
                </p>
              </div>
              {canAnaf && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">Certificate file (.pfx / .p12)</label>
                    <input
                      type="file"
                      accept=".pfx,.p12"
                      onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">Certificate password</label>
                    <input
                      type="password"
                      value={certPassword}
                      onChange={(e) => setCertPassword(e.target.value)}
                      className={INPUT_CLS}
                      placeholder="Enter the certificate password"
                    />
                  </div>
                  <button
                    className={btnPrimary}
                    onClick={() => uploadCertMutation.mutate()}
                    disabled={uploadCertMutation.isPending || !certFile || !certPassword}
                  >
                    {uploadCertMutation.isPending ? "Uploading..." : "Upload & connect"}
                  </button>
                  {uploadCertMutation.error && (
                    <p className="text-sm text-red-600">{(uploadCertMutation.error as Error)?.message}</p>
                  )}
                  {uploadCertMutation.isSuccess && (
                    <p className="text-sm text-green-600">Certificate uploaded and connected to ANAF successfully.</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Provider tab */}
      {activeTab === "provider" && (
        <div className="space-y-4">
          {anafData?.provider?.configured ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-700">
                  Connected via {anafData.provider.provider === "smartbill" ? "SmartBill" : "Oblio"}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {anafData.provider.companyCui && (
                  <>
                    <dt className="text-ink-muted">CUI</dt>
                    <dd className="text-ink">{anafData.provider.companyCui}</dd>
                  </>
                )}
                <dt className="text-ink-muted">Connected</dt>
                <dd className="text-ink">{anafData.provider.connectedAt ? new Date(anafData.provider.connectedAt).toLocaleString("ro-RO") : "–"}</dd>
              </dl>
              {canAnaf && (
                <button
                  className={`${btnSecondary} !text-red-600`}
                  onClick={() => disconnectProviderMutation.mutate()}
                  disabled={disconnectProviderMutation.isPending}
                >
                  Disconnect provider
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-sm text-blue-800 font-medium">Use an invoicing provider</p>
                <p className="mt-1 text-xs text-blue-700">
                  Connect your SmartBill or Oblio account. They handle ANAF submission for you —
                  no certificate needed. You'll need an API key from your provider account.
                </p>
              </div>
              {canAnaf && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">Provider</label>
                    <select
                      value={providerType}
                      onChange={(e) => setProviderType(e.target.value)}
                      className={INPUT_CLS}
                    >
                      <option value="smartbill">SmartBill</option>
                      <option value="oblio">Oblio</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">API key</label>
                    <input
                      value={providerApiKey}
                      onChange={(e) => setProviderApiKey(e.target.value)}
                      className={INPUT_CLS}
                      placeholder={providerType === "smartbill" ? "SmartBill API token" : "Oblio API key"}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">
                      {providerType === "smartbill" ? "Email (SmartBill account)" : "API secret"}
                    </label>
                    <input
                      value={providerApiSecret}
                      onChange={(e) => setProviderApiSecret(e.target.value)}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">Company CUI</label>
                    <input
                      value={providerCui}
                      onChange={(e) => setProviderCui(e.target.value)}
                      className={INPUT_CLS}
                      placeholder="e.g. 12345678"
                    />
                  </div>
                  <button
                    className={btnPrimary}
                    onClick={() => connectProviderMutation.mutate()}
                    disabled={connectProviderMutation.isPending || !providerApiKey}
                  >
                    {connectProviderMutation.isPending ? "Connecting..." : "Connect provider"}
                  </button>
                  {connectProviderMutation.error && (
                    <p className="text-sm text-red-600">{(connectProviderMutation.error as Error)?.message}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* OAuth tab */}
      {activeTab === "oauth" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
            <p className="text-sm text-amber-800 font-medium">Advanced — requires browser certificate</p>
            <p className="mt-1 text-xs text-amber-700">
              You will be redirected to ANAF's login page where you must present your qualified
              digital certificate (.pfx) installed in your browser. This is the official ANAF OAuth flow
              but requires technical setup on your machine.
            </p>
          </div>
          {anafData?.connected && anafData?.connectionMethod === "oauth" ? (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-700">Connected via browser OAuth</span>
            </div>
          ) : canAnaf ? (
            <>
              <button
                className={btnPrimary}
                onClick={() => connectAnafMutation.mutate()}
                disabled={connectAnafMutation.isPending}
              >
                {connectAnafMutation.isPending ? "Redirecting to ANAF..." : "Connect via browser"}
              </button>
              {connectAnafMutation.error && (
                <p className="text-sm text-red-600">{(connectAnafMutation.error as Error)?.message}</p>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
