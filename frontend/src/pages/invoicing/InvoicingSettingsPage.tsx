import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
            ← {t("pages.invoiceDetail.backToInvoices")}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{t("pages.invoicingSettings.title")}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {t("pages.invoicingSettings.pageSubtitle")}
          </p>
        </header>

        {anafResult === "connected" && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {t("pages.invoicingSettings.anafConnectedSuccess")}
          </div>
        )}
        {anafResult === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {t("pages.invoicingSettings.anafConnectionFailed", { message: searchParams.get("message") ?? "" })}
          </div>
        )}

        <div className="space-y-8">
          {/* Fiscal profile */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">{t("pages.invoicingSettings.fiscalProfileTitle")}</h2>
            {profileQuery.isLoading ? (
              <p className="text-sm text-ink-muted">{t("common.loading")}</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoicingSettings.cuiRequiredLabel")}</label>
                  <input value={fp.cui} onChange={(e) => patchFp("cui", e.target.value)} className={INPUT_CLS} placeholder={t("pages.invoicingSettings.cuiPlaceholderNumeric")} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoicingSettings.companyNameRequiredLabel")}</label>
                  <input value={fp.companyName} onChange={(e) => patchFp("companyName", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoiceDetail.regComLabel")}</label>
                  <input value={fp.regCom} onChange={(e) => patchFp("regCom", e.target.value)} className={INPUT_CLS} placeholder={t("pages.invoiceForm.regComPlaceholder")} />
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input type="checkbox" checked={fp.isVatPayer} onChange={(e) => patchFp("isVatPayer", e.target.checked)} className="rounded" />
                    {t("pages.invoicingSettings.vatPayerFullLabel")}
                  </label>
                </div>
                {fp.isVatPayer && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoicingSettings.vatCodeLabel")}</label>
                    <input value={fp.vatCode} onChange={(e) => patchFp("vatCode", e.target.value)} className={INPUT_CLS} placeholder={t("pages.invoicingSettings.vatCodePlaceholder")} />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoiceForm.countyLabel")}</label>
                  <input value={fp.addressCounty} onChange={(e) => patchFp("addressCounty", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoiceForm.cityLabel")}</label>
                  <input value={fp.addressCity} onChange={(e) => patchFp("addressCity", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoiceForm.streetLabel")}</label>
                  <input value={fp.addressStreet} onChange={(e) => patchFp("addressStreet", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoices.colNumber")}</label>
                  <input value={fp.addressNumber} onChange={(e) => patchFp("addressNumber", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoicingSettings.zipCodeLabel")}</label>
                  <input value={fp.addressZip} onChange={(e) => patchFp("addressZip", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoiceForm.bankNameLabel")}</label>
                  <input value={fp.bankName} onChange={(e) => patchFp("bankName", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoiceForm.ibanLabel")}</label>
                  <input value={fp.bankIban} onChange={(e) => patchFp("bankIban", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoicingSettings.legalRepresentativeLabel")}</label>
                  <input value={fp.legalRepresentative} onChange={(e) => patchFp("legalRepresentative", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoiceForm.phoneLabel")}</label>
                  <input value={fp.phone} onChange={(e) => patchFp("phone", e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoiceDetail.emailLabel")}</label>
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
                  {saveFpMutation.isPending ? t("pages.invoicingSettings.savingButton") : t("pages.invoicingSettings.saveFiscalProfileButton")}
                </button>
              </div>
            )}
            {saveFpMutation.isSuccess && (
              <p className="mt-2 text-right text-sm text-green-600">{t("common.saved")}</p>
            )}
          </div>

          {/* Invoice series */}
          <div className="rounded-xl border border-border bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">{t("pages.invoicingSettings.invoiceSeriesTitle")}</h2>
            {seriesQuery.data?.length ? (
              <div className="mb-4 space-y-2">
                {seriesQuery.data.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 rounded-lg border border-border/50 bg-surface p-3">
                    <span className="font-mono font-semibold text-ink">{s.prefix}</span>
                    <span className="text-sm text-ink-muted">{t("pages.invoicingSettings.nextNumberLabel", { number: s.next_number })}</span>
                    <span className={`text-xs ${s.is_active ? "text-green-600" : "text-gray-400"}`}>
                      {s.is_active ? t("status.active") : t("status.inactive")}
                    </span>
                    {s.is_default && (
                      <span className="rounded bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">{t("pages.invoicingSettings.defaultBadge")}</span>
                    )}
                    {!s.is_default && canManage && (
                      <button
                        className="text-xs text-brand hover:underline"
                        onClick={() => toggleDefaultMutation.mutate(s.id)}
                      >
                        {t("pages.invoicingSettings.setAsDefaultButton")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-4 text-sm text-ink-muted">{t("pages.invoicingSettings.noSeriesConfigured")}</p>
            )}
            {canManage && (
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoicingSettings.prefixLabel")}</label>
                  <input value={newPrefix} onChange={(e) => setNewPrefix(e.target.value.toUpperCase())} className={`${INPUT_CLS} w-24`} placeholder="FV" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoicingSettings.startNumberLabel")}</label>
                  <input type="number" min={1} value={newStartNumber} onChange={(e) => setNewStartNumber(parseInt(e.target.value) || 1)} className={`${INPUT_CLS} w-24`} />
                </div>
                <button
                  className={btnPrimary}
                  onClick={() => createSeriesMutation.mutate()}
                  disabled={createSeriesMutation.isPending || !newPrefix.trim()}
                >
                  {t("pages.invoicingSettings.addSeries")}
                </button>
              </div>
            )}
          </div>

          {/* ANAF connection — active status */}
          {anafQuery.data?.connected && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-700">{t("pages.invoicingSettings.connectedToAnaf")}</span>
                {anafQuery.data.connectionMethod && (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    {t("pages.invoicingSettings.viaConnectionMethod", { method: anafQuery.data.connectionMethod })}
                  </span>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-ink-muted">{t("pages.invoiceDetail.cuiLabel")}</dt>
                <dd className="text-ink">{anafQuery.data.cui}</dd>
                <dt className="text-ink-muted">{t("pages.invoicingSettings.connectedAtLabel")}</dt>
                <dd className="text-ink">{anafQuery.data.connectedAt ? new Date(anafQuery.data.connectedAt).toLocaleString("ro-RO") : "–"}</dd>
                <dt className="text-ink-muted">{t("pages.invoicingSettings.tokenExpiresLabel")}</dt>
                <dd className="text-ink">{anafQuery.data.expiresAt ? new Date(anafQuery.data.expiresAt).toLocaleString("ro-RO") : "–"}</dd>
              </dl>
              {canAnaf && (
                <button
                  className={`${btnSecondary} !text-red-600 mt-3`}
                  onClick={() => disconnectAnafMutation.mutate()}
                  disabled={disconnectAnafMutation.isPending}
                >
                  {t("pages.invoicingSettings.disconnectButton")}
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

function UploadCloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

function AnafConnectionOptions({ anafData, anafLoading, canAnaf, connectAnafMutation, queryClient }: any) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"certificate" | "oauth" | "provider">("certificate");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState("");
  const certFileInputRef = useRef<HTMLInputElement>(null);
  const [providerType, setProviderType] = useState("smartbill");
  const [providerApiKey, setProviderApiKey] = useState("");
  const [providerApiSecret, setProviderApiSecret] = useState("");
  const [providerCui, setProviderCui] = useState("");

  const uploadCertMutation = useMutation({
    mutationFn: () => {
      if (!certFile) throw new Error(t("pages.invoicingSettings.selectCertificateFileError"));
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
        <p className="text-sm text-ink-muted">{t("pages.invoicingSettings.checkingConnection")}</p>
      </div>
    );
  }

  const tabs = [
    { id: "certificate" as const, label: t("pages.invoicingSettings.tabCertificateLabel"), desc: t("pages.invoicingSettings.tabCertificateDesc") },
    { id: "provider" as const, label: t("pages.invoicingSettings.tabProviderLabel"), desc: t("pages.invoicingSettings.tabProviderDesc") },
    { id: "oauth" as const, label: t("pages.invoicingSettings.tabOauthLabel"), desc: t("pages.invoicingSettings.tabOauthDesc") },
  ];

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-card">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">{t("pages.invoicingSettings.anafConnectionTitle")}</h2>
      <p className="mb-4 text-sm text-ink-muted">{t("pages.invoicingSettings.anafConnectionSubtitle")}</p>

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
                <span className="text-sm font-medium text-green-700">{t("pages.invoicingSettings.certificateUploaded")}</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-ink-muted">{t("pages.invoicingSettings.fileLabel")}</dt>
                <dd className="text-ink">{anafData.certificate.subject}</dd>
                <dt className="text-ink-muted">{t("pages.invoicingSettings.uploadedLabel")}</dt>
                <dd className="text-ink">{anafData.certificate.uploadedAt ? new Date(anafData.certificate.uploadedAt).toLocaleString("ro-RO") : "–"}</dd>
              </dl>
              {canAnaf && (
                <button
                  className={`${btnSecondary} !text-red-600`}
                  onClick={() => deleteCertMutation.mutate()}
                  disabled={deleteCertMutation.isPending}
                >
                  {t("pages.invoicingSettings.removeCertificateButton")}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-sm text-blue-800 font-medium">{t("pages.invoicingSettings.easiestWayTitle")}</p>
                <p className="mt-1 text-xs text-blue-700">
                  {t("pages.invoicingSettings.easiestWayDesc")}
                </p>
              </div>
              {canAnaf && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-muted">{t("pages.invoicingSettings.certificateFileLabel")}</label>
                    <div className="rounded-xl border-2 border-dashed border-border/80 bg-brand-mint/10 p-5 text-center transition-all duration-200 hover:border-brand/40 hover:bg-brand-mint/20">
                      <input
                        ref={certFileInputRef}
                        type="file"
                        accept=".pfx,.p12"
                        onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
                        className="hidden"
                      />
                      {certFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                            <UploadCloudIcon className="h-5 w-5" />
                          </span>
                          <p className="max-w-full truncate text-sm font-medium text-ink">{certFile.name}</p>
                          <p className="text-xs text-ink-muted">{(certFile.size / 1024).toFixed(1)} KB</p>
                          <button
                            type="button"
                            onClick={() => certFileInputRef.current?.click()}
                            className="text-sm font-medium text-brand hover:underline"
                          >
                            {t("pages.invoicingSettings.changeFileButton")}
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                            <UploadCloudIcon className="h-5 w-5" />
                          </span>
                          <p className="mb-1 text-sm font-medium text-ink">{t("pages.invoicingSettings.dragDropCertHint")}</p>
                          <p className="mb-3 text-xs text-ink-muted">{t("pages.invoicingSettings.acceptedFormatsHint")}</p>
                          <button
                            type="button"
                            onClick={() => certFileInputRef.current?.click()}
                            className="inline-flex h-10 items-center rounded-xl border border-brand/60 bg-white px-4 text-sm font-medium text-brand shadow-sm transition-all duration-200 hover:border-brand hover:bg-brand-mint/20"
                          >
                            {t("pages.invoicingSettings.selectFileButton")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoicingSettings.certificatePasswordLabel")}</label>
                    <input
                      type="password"
                      value={certPassword}
                      onChange={(e) => setCertPassword(e.target.value)}
                      className={INPUT_CLS}
                      placeholder={t("pages.invoicingSettings.certificatePasswordPlaceholder")}
                    />
                  </div>
                  <button
                    className={btnPrimary}
                    onClick={() => uploadCertMutation.mutate()}
                    disabled={uploadCertMutation.isPending || !certFile || !certPassword}
                  >
                    {uploadCertMutation.isPending ? t("pages.invoicingSettings.uploadingButton") : t("pages.invoicingSettings.uploadAndConnectButton")}
                  </button>
                  {uploadCertMutation.error && (
                    <p className="text-sm text-red-600">{(uploadCertMutation.error as Error)?.message}</p>
                  )}
                  {uploadCertMutation.isSuccess && (
                    <p className="text-sm text-green-600">{t("pages.invoicingSettings.certificateUploadSuccess")}</p>
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
                  {t("pages.invoicingSettings.connectedViaProvider", { provider: anafData.provider.provider === "smartbill" ? "SmartBill" : "Oblio" })}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {anafData.provider.companyCui && (
                  <>
                    <dt className="text-ink-muted">{t("pages.invoiceDetail.cuiLabel")}</dt>
                    <dd className="text-ink">{anafData.provider.companyCui}</dd>
                  </>
                )}
                <dt className="text-ink-muted">{t("pages.invoicingSettings.connectedLabel")}</dt>
                <dd className="text-ink">{anafData.provider.connectedAt ? new Date(anafData.provider.connectedAt).toLocaleString("ro-RO") : "–"}</dd>
              </dl>
              {canAnaf && (
                <button
                  className={`${btnSecondary} !text-red-600`}
                  onClick={() => disconnectProviderMutation.mutate()}
                  disabled={disconnectProviderMutation.isPending}
                >
                  {t("pages.invoicingSettings.disconnectProviderButton")}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-sm text-blue-800 font-medium">{t("pages.invoicingSettings.useProviderTitle")}</p>
                <p className="mt-1 text-xs text-blue-700">
                  {t("pages.invoicingSettings.useProviderDesc")}
                </p>
              </div>
              {canAnaf && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoicingSettings.providerLabel")}</label>
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
                    <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoicingSettings.apiKeyLabel")}</label>
                    <input
                      value={providerApiKey}
                      onChange={(e) => setProviderApiKey(e.target.value)}
                      className={INPUT_CLS}
                      placeholder={providerType === "smartbill" ? t("pages.invoicingSettings.smartbillTokenPlaceholder") : t("pages.invoicingSettings.oblioApiKeyPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">
                      {providerType === "smartbill" ? t("pages.invoicingSettings.smartbillEmailLabel") : t("pages.invoicingSettings.apiSecretLabel")}
                    </label>
                    <input
                      value={providerApiSecret}
                      onChange={(e) => setProviderApiSecret(e.target.value)}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted">{t("pages.invoicingSettings.companyCuiLabel")}</label>
                    <input
                      value={providerCui}
                      onChange={(e) => setProviderCui(e.target.value)}
                      className={INPUT_CLS}
                      placeholder={t("pages.invoicingSettings.cuiPlaceholderNumeric")}
                    />
                  </div>
                  <button
                    className={btnPrimary}
                    onClick={() => connectProviderMutation.mutate()}
                    disabled={connectProviderMutation.isPending || !providerApiKey}
                  >
                    {connectProviderMutation.isPending ? t("pages.invoicingSettings.connectingButton") : t("pages.invoicingSettings.connectProviderButton")}
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
            <p className="text-sm text-amber-800 font-medium">{t("pages.invoicingSettings.advancedOauthTitle")}</p>
            <p className="mt-1 text-xs text-amber-700">
              {t("pages.invoicingSettings.advancedOauthDesc")}
            </p>
          </div>
          {anafData?.connected && anafData?.connectionMethod === "oauth" ? (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-700">{t("pages.invoicingSettings.connectedViaOauth")}</span>
            </div>
          ) : canAnaf ? (
            <>
              <button
                className={btnPrimary}
                onClick={() => connectAnafMutation.mutate()}
                disabled={connectAnafMutation.isPending}
              >
                {connectAnafMutation.isPending ? t("pages.invoicingSettings.redirectingToAnaf") : t("pages.invoicingSettings.connectViaBrowserButton")}
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
