import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Papa from "papaparse";
import { useAuthStore } from "../../store/authStore";
import {
  previewEarningsImport,
  commitEarningsImport,
  cancelEarningsImport,
  fetchOrgImportSettings,
  patchOrgImportSettings,
  type EarningsPreviewResponse,
  type EarningsCommitResponse,
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
import { useUnsavedImportNavigationGuard } from "../../hooks/useUnsavedImportNavigationGuard";

function providerLabel(value: string): string {
  return PROVIDER_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function localIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function weeklyDefaultRange(): { start: string; end: string } {
  const ref = new Date();
  const end = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(end.getDate() - 7);
  return { start: localIsoDate(start), end: localIsoDate(end) };
}

function errMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const m = e.response?.data as { message?: string } | undefined;
    if (m?.message) return m.message;
    return e.message;
  }
  return e instanceof Error ? e.message : "Something went wrong";
}

export function EarningsImportPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importSuccess, setImportSuccess] = useState<EarningsCommitResponse | null>(null);

  const [preview, setPreview] = useState<EarningsPreviewResponse | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [clientCsvRowCount, setClientCsvRowCount] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("uber");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [commitImportOpen, setCommitImportOpen] = useState(false);
  const [revertImportId, setRevertImportId] = useState<string | null>(null);
  const [deleteImportId, setDeleteImportId] = useState<string | null>(null);
  const [glovoCommissionBaseType, setGlovoCommissionBaseType] = useState<string>("net_income");

  const { setClientDebtScan, runClientDebtScan, debtSummaryLine } = useCsvValidation(preview);

  const { blocker: importNavBlocker } = useUnsavedImportNavigationGuard({
    isDirty: Boolean(preview),
    stagedImportId: preview?.importId ?? null,
  });

  useEffect(() => {
    const { start, end } = weeklyDefaultRange();
    setPeriodStart(start);
    setPeriodEnd(end);
  }, []);

  useEffect(() => {
    if (preview?.platform) setSelectedPlatform(preview.platform);
  }, [preview?.platform, preview?.importId]);

  useEffect(() => {
    if (!preview) setCommitImportOpen(false);
  }, [preview]);

  const importsQuery = useQuery({
    queryKey: ["earnings", "imports"],
    queryFn: () => getEarningsImports(1, 15).then((r) => r.data),
    enabled: user?.role === "admin" || user?.role === "accountant",
  });

  const orgImportSettingsQuery = useQuery({
    queryKey: ["earnings", "org-import-settings"],
    queryFn: () => fetchOrgImportSettings().then((r) => r.data),
    enabled: user?.role === "admin" || user?.role === "accountant",
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
      setPreview(res.data);
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

  const commitMut = useMutation({
    mutationFn: (args: { importId: string; platform: string; weekStart: string; weekEnd: string }) =>
      commitEarningsImport(args.importId, {
        platform: args.platform,
        weekStart: args.weekStart,
        weekEnd: args.weekEnd,
      }),
    onSuccess: (res) => {
      setImportSuccess(res.data);
      setPreview(null);
      setClientDebtScan(null);
      setLocalError(null);
      void queryClient.invalidateQueries({ queryKey: ["earnings"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
    onError: (e) => setLocalError(errMessage(e)),
  });

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
    [previewMut, setClientDebtScan, runClientDebtScan, selectedPlatform, glovoCommissionBaseType],
  );

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
    Boolean(periodStart && periodEnd && periodStart <= periodEnd) &&
    PROVIDER_OPTIONS.some((o) => o.value === selectedPlatform);

  if (user?.role !== "admin" && user?.role !== "accountant") {
    return <p className="p-6 text-ink-muted">You do not have access to earnings import.</p>;
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-surface-elevated">
      <EarningsImportHeader />

      <div className={`${driversPage} !space-y-5 !py-5 sm:!py-6`}>
        {localError && <div className={alertError}>{localError}</div>}

        {importSuccess && (
          <div className={alertSuccess}>
            <p className="font-medium">Import complete</p>
            <p className="mt-1 opacity-90">{importSuccess.insertedRows} row(s) saved.</p>
          </div>
        )}

        {importSuccess?.warnings && importSuccess.warnings.length > 0 && (
          <div className="rounded-[20px] border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-ink">
            <p className="text-xs font-semibold text-warning">Vehicle return check</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-ink-muted">
              {importSuccess.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {!preview && selectedPlatform === "glovo" && (
          <EarningsImportGlovoSettings
            value={glovoCommissionBaseType}
            onChange={(v) => {
              setGlovoCommissionBaseType(v);
              if (user?.role === "admin") patchOrgImportSettingsMut.mutate(v);
            }}
            disabled={busy || patchOrgImportSettingsMut.isPending}
            isAdmin={user?.role === "admin"}
          />
        )}

        {!preview ? (
          <EarningsImportUploadCard
            dragActive={dragActive}
            isPending={previewMut.isPending}
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
          />
        ) : (
          <EarningsImportPreviewPanel
            preview={preview}
            providerLabel={providerLabel}
            selectedPlatform={selectedPlatform}
            onPlatformChange={setSelectedPlatform}
            periodStart={periodStart}
            periodEnd={periodEnd}
            onPeriodStartChange={setPeriodStart}
            onPeriodEndChange={setPeriodEnd}
            clientCsvRowCount={clientCsvRowCount}
            debtSummaryLine={debtSummaryLine}
            busy={busy}
            periodValid={periodValid}
            onConfirm={() => setCommitImportOpen(true)}
            onCancel={() => cancelMut.mutate(preview.importId)}
          />
        )}

        {!preview && <EarningsImportFeatureCards />}

        <RecentImportsTable
          rows={importsQuery.data?.items ?? []}
          isLoading={importsQuery.isLoading}
          busy={busy}
          isAdmin={user?.role === "admin"}
          onResync={() => syncMut.mutate()}
          resyncPending={syncMut.isPending}
          onDelete={setDeleteImportId}
          onRevert={setRevertImportId}
        />
      </div>

      <ConfirmDialog
        open={commitImportOpen && Boolean(preview)}
        onClose={() => !commitMut.isPending && setCommitImportOpen(false)}
        title="Commit this CSV import?"
        description={
          preview ? (
            <div className="space-y-2">
              <p>
                <span className="text-ink-muted">File:</span>{" "}
                <span className="font-medium text-ink">{preview.fileName}</span>
              </p>
              <p>
                <span className="text-ink-muted">Provider:</span>{" "}
                <span className="font-medium text-ink">{providerLabel(selectedPlatform)}</span>
              </p>
              <p>
                <span className="text-ink-muted">Pay period:</span>{" "}
                <span className="font-medium text-ink">
                  {periodStart} → {periodEnd}
                </span>
              </p>
              <p>
                <span className="text-ink-muted">Rows in file:</span>{" "}
                <span className="font-medium tabular-nums text-ink">{preview.totalRows.toLocaleString()}</span>
              </p>
              {preview.aggregates != null && (
                <p>
                  <span className="text-ink-muted">Estimated valid rows to insert:</span>{" "}
                  <span className="font-semibold tabular-nums text-brand">
                    {(preview.aggregates.valid ?? 0).toLocaleString()}
                  </span>
                </p>
              )}
              {debtSummaryLine && (
                <p className="rounded-lg border border-danger/20 bg-danger/5 px-2 py-1.5 text-xs text-danger">
                  {debtSummaryLine}
                </p>
              )}
              <p className="pt-1 text-xs text-ink-muted">
                Only rows with a matched driver and money fields are written.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Import now"
        cancelLabel="Go back"
        confirmVariant="primary"
        isLoading={commitMut.isPending}
        onConfirm={async () => {
          if (!preview) return;
          await commitMut.mutateAsync({
            importId: preview.importId,
            platform: selectedPlatform,
            weekStart: periodStart,
            weekEnd: periodEnd,
          });
          setCommitImportOpen(false);
        }}
      />

      <ConfirmDialog
        open={deleteImportId != null}
        onClose={() => !deleteImportMut.isPending && setDeleteImportId(null)}
        title="Delete this import?"
        description={
          <p className="text-sm text-ink-muted">
            This import has no processed earnings rows. It will be permanently removed from import history.
          </p>
        }
        confirmLabel="Delete import"
        cancelLabel="Cancel"
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
        title="Revert this import?"
        description={
          <div className="space-y-2 text-sm text-ink-muted">
            <p>
              This creates offsetting negative earnings records and marks the import as reverted.
            </p>
            <p className="font-medium text-warning">
              Revert is blocked if any payout for this period is already marked paid.
            </p>
          </div>
        }
        confirmLabel="Revert import"
        cancelLabel="Cancel"
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
        title="Discard unsaved import?"
        description={
          <p>
            You have a staged import preview. Leaving will delete it on the server and you will need to upload
            again.
          </p>
        }
        confirmLabel="Leave page"
        cancelLabel="Stay on import"
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
