import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Papa from "papaparse";
import { Trans, useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { useCanAdjustPayouts, useCanImportEarnings, useCanViewImports, usePermission } from "../../lib/permissions";
import {
  previewEarningsImport,
  commitEarningsImport,
  cancelEarningsImport,
  fetchOrgImportSettings,
  patchOrgImportSettings,
  shouldAppendToExistingWeek,
  type EarningsPreviewResponse,
  type EarningsCommitResponse,
  type ExistingWeekImport,
} from "../../api/earningsImport";
import {
  deleteEarningsImport,
  getEarningsImports,
  revertEarningsImport,
  syncEarningsVehicleRentals,
} from "../../api/earnings";
import { ConfirmDialog } from "../../components/UI/ConfirmDialog";
import { EarningsImportFeatureCards } from "../../components/earnings/import/EarningsImportFeatureCards";
import { EarningsImportGlovoSettings } from "../../components/earnings/import/EarningsImportGlovoSettings";
import { EarningsImportHeader } from "../../components/earnings/import/EarningsImportHeader";
import {
  EarningsImportPreviewPanel,
  PROVIDER_OPTIONS,
} from "../../components/earnings/import/EarningsImportPreviewPanel";
import { EarningsImportUploadCard } from "../../components/earnings/import/EarningsImportUploadCard";
import { RecentImportsTable } from "../../components/earnings/import/RecentImportsTable";
import { alertError, alertSuccess, driversPage } from "../../theme/classNames";
import { useCsvValidation } from "../../hooks/useCsvValidation";
import { useEarningsImportPeriod } from "../../hooks/useEarningsImportPeriod";
import { useUploadPhase } from "../../hooks/useUploadPhase";
import { useUnsavedImportNavigationGuard } from "../../hooks/useUnsavedImportNavigationGuard";
import { getPreviousWeek } from "../../utils/earningsImportWeek";

function providerLabel(value: string): string {
  return PROVIDER_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function errMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const m = e.response?.data as { message?: string } | undefined;
    if (m?.message) return m.message;
    return e.message;
  }
  return e instanceof Error ? e.message : i18n.t("pages.earningsImport.somethingWentWrong");
}

export function EarningsImportPage() {
  const { t } = useTranslation();
  const canViewImports = useCanViewImports();
  const canImport = useCanImportEarnings();
  const canAdjustPayouts = useCanAdjustPayouts();
  const canDeleteImport = usePermission("imports.delete");
  const canManageSettings = usePermission("settings.manage");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importSuccess, setImportSuccess] = useState<EarningsCommitResponse | null>(null);

  const [preview, setPreview] = useState<EarningsPreviewResponse | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [clientCsvRowCount, setClientCsvRowCount] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("uber");
  const [commitImportOpen, setCommitImportOpen] = useState(false);
  const [forceAppendWeek, setForceAppendWeek] = useState<ExistingWeekImport | null>(null);
  const [revertImportId, setRevertImportId] = useState<string | null>(null);
  const [deleteImportId, setDeleteImportId] = useState<string | null>(null);
  const [glovoCommissionBaseType, setGlovoCommissionBaseType] = useState<string>("net_income");

  const { setClientDebtScan, runClientDebtScan, debtSummaryLine } = useCsvValidation(preview);

  const { blocker: importNavBlocker } = useUnsavedImportNavigationGuard({
    isDirty: Boolean(preview),
    stagedImportId: preview?.importId ?? null,
  });

  const importsQuery = useQuery({
    queryKey: ["earnings", "imports"],
    queryFn: () => getEarningsImports(1, 15).then((r) => r.data),
    enabled: canViewImports,
  });

  const {
    periodStart,
    periodEnd,
    setPeriodStart,
    setPeriodEnd,
    applyPreviousWeek,
    validationForPlatform,
  } = useEarningsImportPeriod(importsQuery.data?.items);

  useEffect(() => {
    applyPreviousWeek();
  }, [applyPreviousWeek]);

  useEffect(() => {
    if (preview?.platform) setSelectedPlatform(preview.platform);
  }, [preview?.platform, preview?.importId]);

  useEffect(() => {
    if (!preview) {
      setCommitImportOpen(false);
      setForceAppendWeek(null);
    }
  }, [preview]);

  const orgImportSettingsQuery = useQuery({
    queryKey: ["earnings", "org-import-settings"],
    queryFn: () => fetchOrgImportSettings().then((r) => r.data),
    enabled: canViewImports,
  });

  useEffect(() => {
    const v = orgImportSettingsQuery.data?.glovoCommissionBaseType;
    if (v) setGlovoCommissionBaseType(v);
  }, [orgImportSettingsQuery.data?.glovoCommissionBaseType]);

  const patchOrgImportSettingsMut = useMutation({
    mutationFn: (next: string) =>
      patchOrgImportSettings({ glovoCommissionBaseType: next }).then((r) => r.data),
    onSuccess: (data) => {
      setGlovoCommissionBaseType(data.glovoCommissionBaseType);
      setLocalError(null);
      void queryClient.invalidateQueries({ queryKey: ["earnings", "org-import-settings"] });
    },
    onError: (e) => setLocalError(errMessage(e)),
  });

  const previewMut = useMutation({
    mutationFn: (input: { file: File; glovoCommissionBaseType?: string }) =>
      previewEarningsImport(input.file, { glovoCommissionBaseType: input.glovoCommissionBaseType }),
    onSuccess: (res) => {
      setLocalError(null);
      setImportSuccess(null);
      setForceAppendWeek(null);
      setPreview(res.data);
      if (res.data.weekStart) setPeriodStart(res.data.weekStart);
      if (res.data.weekEnd) setPeriodEnd(res.data.weekEnd);
      if (res.data.existingWeekImport) {
        setPeriodStart(res.data.existingWeekImport.weekStart);
        setPeriodEnd(res.data.existingWeekImport.weekEnd);
      }
      if (res.data.glovoCommissionBaseType) {
        setGlovoCommissionBaseType(res.data.glovoCommissionBaseType);
      }
      setClientCsvRowCount(null);
    },
    onError: (e) => {
      setPreview(null);
      setLocalError(errMessage(e));
    },
  });

  const uploadPhase = useUploadPhase(previewMut.isPending);
  const uploadError = !preview && localError && previewMut.isError ? localError : null;

  const commitMut = useMutation({
    mutationFn: (args: {
      importId: string;
      platform: string;
      weekStart: string;
      weekEnd: string;
      appendToExistingWeek?: boolean;
    }) =>
      commitEarningsImport(args.importId, {
        platform: args.platform,
        weekStart: args.weekStart,
        weekEnd: args.weekEnd,
        appendToExistingWeek: args.appendToExistingWeek,
      }),
    onSuccess: (res) => {
      setImportSuccess(res.data);
      setPreview(null);
      setForceAppendWeek(null);
      setClientDebtScan(null);
      setLocalError(null);
      void queryClient.invalidateQueries({ queryKey: ["earnings"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
    onError: (e) => {
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as {
          appendAllowed?: boolean;
          existingWeekImport?: ExistingWeekImport;
          message?: string;
        } | undefined;
        if (data?.appendAllowed && data.existingWeekImport) {
          setForceAppendWeek(data.existingWeekImport);
          setPeriodStart(data.existingWeekImport.weekStart);
          setPeriodEnd(data.existingWeekImport.weekEnd);
          setCommitImportOpen(true);
          setLocalError(null);
          return;
        }
      }
      setLocalError(errMessage(e));
    },
  });

  const appendWeek =
    forceAppendWeek ??
    (preview &&
    shouldAppendToExistingWeek(preview.existingWeekImport, selectedPlatform, periodStart, periodEnd)
      ? preview.existingWeekImport
      : null);

  const syncMut = useMutation({
    mutationFn: () => syncEarningsVehicleRentals(),
    onSuccess: () => {
      setLocalError(null);
      void queryClient.invalidateQueries({ queryKey: ["earnings"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
    onError: (e) => setLocalError(errMessage(e)),
  });

  const cancelMut = useMutation({
    mutationFn: (importId: string) => cancelEarningsImport(importId),
    onSuccess: () => {
      setPreview(null);
      setClientDebtScan(null);
      setLocalError(null);
      void queryClient.invalidateQueries({ queryKey: ["earnings", "imports"] });
    },
    onError: (e) => setLocalError(errMessage(e)),
  });

  const revertMut = useMutation({
    mutationFn: (importId: string) => revertEarningsImport(importId).then((r) => r.data),
    onSuccess: () => {
      setRevertImportId(null);
      setLocalError(null);
      void queryClient.invalidateQueries({ queryKey: ["earnings", "imports"] });
      void queryClient.invalidateQueries({ queryKey: ["earnings"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
    onError: (e) => setLocalError(errMessage(e)),
  });

  const deleteImportMut = useMutation({
    mutationFn: (importId: string) => deleteEarningsImport(importId),
    onSuccess: () => {
      setDeleteImportId(null);
      setLocalError(null);
      void queryClient.invalidateQueries({ queryKey: ["earnings", "imports"] });
    },
    onError: (e) => setLocalError(errMessage(e)),
  });

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const { start, end } = getPreviousWeek();
      setPeriodStart(start);
      setPeriodEnd(end);
      setClientCsvRowCount(null);
      setClientDebtScan(null);
      if (file.name.toLowerCase().endsWith(".csv")) {
        void runClientDebtScan(file);
        Papa.parse<Record<string, unknown>>(file, {
          header: true,
          skipEmptyLines: "greedy",
          complete: (results) => {
            const n = Array.isArray(results.data) ? results.data.length : 0;
            setClientCsvRowCount(n);
          },
          error: () => setClientCsvRowCount(null),
        });
      }
      previewMut.mutate({
        file,
        glovoCommissionBaseType:
          selectedPlatform === "glovo" ? glovoCommissionBaseType : undefined,
      });
    },
    [
      previewMut,
      setClientDebtScan,
      runClientDebtScan,
      selectedPlatform,
      glovoCommissionBaseType,
      setPeriodStart,
      setPeriodEnd,
    ],
  );

  const periodValidation = validationForPlatform(selectedPlatform);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFile(e.dataTransfer.files?.[0]);
    },
    [handleFile],
  );

  const busy =
    previewMut.isPending ||
    commitMut.isPending ||
    cancelMut.isPending ||
    syncMut.isPending ||
    revertMut.isPending ||
    deleteImportMut.isPending;

  const periodValid =
    periodValidation.valid && PROVIDER_OPTIONS.some((o) => o.value === selectedPlatform);

  if (!canViewImports) {
    return <p className="p-6 text-ink-muted">{t("pages.earningsImport.noAccess")}</p>;
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-[#E8ECF2]">
      <EarningsImportHeader />

      <div className={`${driversPage} !space-y-3 !py-4 sm:!space-y-3.5 sm:!py-5`}>
        {localError && !uploadError && <div className={alertError}>{localError}</div>}

        {importSuccess && (
          <div className={`${alertSuccess} rounded-2xl border-emerald-200/60 shadow-soft`}>
            <p className="font-medium">{t("pages.earningsImport.importCompleteTitle")}</p>
            <p className="mt-1 opacity-90">{t("pages.earningsImport.rowsSaved", { count: importSuccess.insertedRows })}</p>
          </div>
        )}

        {importSuccess?.warnings && importSuccess.warnings.length > 0 && (
          <div className="rounded-[20px] border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-ink">
            <p className="text-xs font-semibold text-warning">{t("pages.earningsImport.vehicleReturnCheck")}</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-ink-muted">
              {importSuccess.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {!preview && selectedPlatform === "glovo" && canImport && (
          <EarningsImportGlovoSettings
            value={glovoCommissionBaseType}
            onChange={(v) => {
              setGlovoCommissionBaseType(v);
              if (canManageSettings) patchOrgImportSettingsMut.mutate(v);
            }}
            disabled={busy || patchOrgImportSettingsMut.isPending}
            isAdmin={canManageSettings}
          />
        )}

        {canImport && !preview ? (
          <EarningsImportUploadCard
            dragActive={dragActive}
            isPending={previewMut.isPending}
            uploadPhase={uploadPhase}
            uploadError={uploadError}
            fileInputRef={fileInputRef}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onFileChange={handleFile}
            onBrowseClick={() => fileInputRef.current?.click()}
            onRetry={() => setLocalError(null)}
          />
        ) : canImport && preview ? (
          <EarningsImportPreviewPanel
            preview={preview}
            providerLabel={providerLabel}
            selectedPlatform={selectedPlatform}
            onPlatformChange={setSelectedPlatform}
            periodStart={periodStart}
            periodEnd={periodEnd}
            onPeriodStartChange={setPeriodStart}
            onPeriodEndChange={setPeriodEnd}
            onResetPreviousWeek={applyPreviousWeek}
            periodValidation={periodValidation}
            clientCsvRowCount={clientCsvRowCount}
            debtSummaryLine={debtSummaryLine}
            busy={busy}
            periodValid={periodValid}
            onConfirm={() => setCommitImportOpen(true)}
            onCancel={() => cancelMut.mutate(preview.importId)}
          />
        ) : !preview ? (
          <p className="rounded-2xl border border-border/60 bg-white px-4 py-3 text-sm text-ink-muted">
            {t("pages.earningsImport.viewOnlyHint")}
          </p>
        ) : null}

        {canImport && !preview && <EarningsImportFeatureCards />}

        <RecentImportsTable
          rows={importsQuery.data?.items ?? []}
          isLoading={importsQuery.isLoading}
          busy={busy}
          canDeleteEmptyImport={canDeleteImport || canImport}
          canRevertImport={canDeleteImport}
          canResync={canAdjustPayouts}
          onResync={() => syncMut.mutate()}
          resyncPending={syncMut.isPending}
          onDelete={setDeleteImportId}
          onRevert={setRevertImportId}
        />
      </div>

      <ConfirmDialog
        open={commitImportOpen && Boolean(preview)}
        onClose={() => !commitMut.isPending && setCommitImportOpen(false)}
        title={appendWeek ? t("pages.earningsImport.addToExistingWeekTitle") : t("pages.earningsImport.commitImportTitle")}
        description={
          preview ? (
            <div className="space-y-2">
              <p>
                <span className="text-ink-muted">{t("pages.earningsImport.fileLabel")}</span>{" "}
                <span className="font-medium text-ink">{preview.fileName}</span>
              </p>
              <p>
                <span className="text-ink-muted">{t("pages.earningsImport.providerLabel")}</span>{" "}
                <span className="font-medium text-ink">{providerLabel(selectedPlatform)}</span>
              </p>
              <p>
                <span className="text-ink-muted">{t("pages.earningsImport.payPeriodLabel")}</span>{" "}
                <span className="font-medium text-ink">
                  {periodStart} → {periodEnd}
                </span>
              </p>
              <p>
                <span className="text-ink-muted">{t("pages.earningsImport.rowsInFileLabel")}</span>{" "}
                <span className="font-medium tabular-nums text-ink">{preview.totalRows.toLocaleString()}</span>
              </p>
              {preview.aggregates != null && (
                <p>
                  <span className="text-ink-muted">{t("pages.earningsImport.estimatedValidRowsLabel")}</span>{" "}
                  <span className="font-semibold tabular-nums text-brand">
                    {(preview.aggregates.valid ?? 0).toLocaleString()}
                  </span>
                </p>
              )}
              {appendWeek && (
                <p className="rounded-lg border border-brand/20 bg-brand/5 px-2 py-1.5 text-xs text-ink">
                  <Trans
                    i18nKey="pages.earningsImport.appendsAlongside"
                    values={{ fileName: appendWeek.fileName ?? t("pages.earningsImport.theExistingImport") }}
                    components={{ b: <span className="font-medium" /> }}
                  />
                </p>
              )}
              {debtSummaryLine && (
                <p className="rounded-lg border border-danger/20 bg-danger/5 px-2 py-1.5 text-xs text-danger">
                  {debtSummaryLine}
                </p>
              )}
              <p className="pt-1 text-xs text-ink-muted">
                {t("pages.earningsImport.onlyMatchedRowsWritten")}
              </p>
            </div>
          ) : null
        }
        confirmLabel={appendWeek ? t("pages.earningsImport.addToThisWeek") : t("pages.earningsImport.importNow")}
        cancelLabel={t("pages.earningsImport.goBack")}
        confirmVariant="primary"
        isLoading={commitMut.isPending}
        onConfirm={async () => {
          if (!preview) return;
          await commitMut.mutateAsync({
            importId: preview.importId,
            platform: selectedPlatform,
            weekStart: periodStart,
            weekEnd: periodEnd,
            appendToExistingWeek: Boolean(appendWeek),
          });
          setCommitImportOpen(false);
        }}
      />

      <ConfirmDialog
        open={deleteImportId != null}
        onClose={() => !deleteImportMut.isPending && setDeleteImportId(null)}
        title={t("pages.earningsImport.deleteImportTitle")}
        description={
          <p className="text-sm text-ink-muted">
            {t("pages.earningsImport.deleteImportDesc")}
          </p>
        }
        confirmLabel={t("pages.earningsImport.deleteImportConfirm")}
        cancelLabel={t("common.cancel")}
        confirmVariant="danger"
        isLoading={deleteImportMut.isPending}
        onConfirm={async () => {
          if (!deleteImportId) return;
          await deleteImportMut.mutateAsync(deleteImportId);
        }}
      />

      <ConfirmDialog
        open={revertImportId != null}
        onClose={() => !revertMut.isPending && setRevertImportId(null)}
        title={t("pages.earningsImport.revertImportTitle")}
        description={
          <div className="space-y-2 text-sm text-ink-muted">
            <p>
              {t("pages.earningsImport.revertImportDesc1")}
            </p>
            <p className="font-medium text-warning">
              {t("pages.earningsImport.revertImportDesc2")}
            </p>
          </div>
        }
        confirmLabel={t("pages.earningsImport.revertImportConfirm")}
        cancelLabel={t("common.cancel")}
        confirmVariant="danger"
        isLoading={revertMut.isPending}
        onConfirm={async () => {
          if (!revertImportId) return;
          await revertMut.mutateAsync(revertImportId);
        }}
      />

      <ConfirmDialog
        open={importNavBlocker.state === "blocked"}
        rootClassName="z-[110]"
        onClose={() => importNavBlocker.reset?.()}
        title={t("pages.earningsImport.discardUnsavedTitle")}
        description={
          <p>
            {t("pages.earningsImport.discardUnsavedDesc")}
          </p>
        }
        confirmLabel={t("pages.earningsImport.leavePage")}
        cancelLabel={t("pages.earningsImport.stayOnImport")}
        confirmVariant="danger"
        isLoading={cancelMut.isPending && importNavBlocker.state === "blocked"}
        onConfirm={async () => {
          const id = preview?.importId;
          if (!id) {
            importNavBlocker.proceed?.();
            return;
          }
          try {
            await cancelMut.mutateAsync(id);
            importNavBlocker.proceed?.();
          } catch {
            importNavBlocker.reset?.();
          }
        }}
      />
    </div>
  );
}
