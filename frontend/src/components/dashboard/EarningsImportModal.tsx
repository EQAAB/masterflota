import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { usePermission } from "../../lib/permissions";
import {
  previewEarningsImport,
  commitEarningsImport,
  cancelEarningsImport,
  fetchOrgImportSettings,
  shouldAppendToExistingWeek,
  type EarningsPreviewResponse,
  type ExistingWeekImport,
} from "../../api/earningsImport";
import { EarningsImportPreviewVirtualTable } from "../earnings/EarningsImportPreviewVirtualTable";
import { ConfirmDialog } from "../UI/ConfirmDialog";
import { getEarningsImports } from "../../api/earnings";
import { useCsvValidation } from "../../hooks/useCsvValidation";
import { useEarningsImportPeriod } from "../../hooks/useEarningsImportPeriod";
import { useUnsavedImportNavigationGuard } from "../../hooks/useUnsavedImportNavigationGuard";
import { ImportPayPeriodFields } from "../earnings/import/ImportPayPeriodFields";
import { getPreviousWeek } from "../../utils/earningsImportWeek";

const PROVIDER_OPTIONS = [
  { value: "uber", label: "Uber" },
  { value: "bolt_taxi", label: "Bolt Taxi" },
  { value: "glovo", label: "Glovo Courier" },
  { value: "bolt_courier", label: "Bolt Delivery" },
  { value: "bolt", label: "Bolt (legacy)" },
  { value: "wolt_courier", label: "Wolt Courier" },
] as const;

function providerLabel(value: string): string {
  return PROVIDER_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function errMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const m = e.response?.data as { message?: string } | undefined;
    if (m?.message) return m.message;
    return e.message;
  }
  return e instanceof Error ? e.message : "Something went wrong";
}

export type EarningsImportModalProps = {
  open: boolean;
  onClose: () => void;
};

export function EarningsImportModal({ open, onClose }: EarningsImportModalProps) {
  const queryClient = useQueryClient();
  const canImport = usePermission("imports.create");

  const [preview, setPreview] = useState<EarningsPreviewResponse | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("uber");
  const [commitImportOpen, setCommitImportOpen] = useState(false);
  const [commitWarnings, setCommitWarnings] = useState<string[]>([]);
  const [forceAppendWeek, setForceAppendWeek] = useState<ExistingWeekImport | null>(null);

  const { setClientDebtScan, runClientDebtScan, debtSummaryLine } = useCsvValidation(preview);

  const { blocker: importNavBlocker } = useUnsavedImportNavigationGuard({
    isDirty: Boolean(preview),
    enabled: open,
    stagedImportId: preview?.importId ?? null,
  });

  useEffect(() => {
    if (!preview) {
      setCommitImportOpen(false);
      setForceAppendWeek(null);
    }
  }, [preview]);

  const importsQuery = useQuery({
    queryKey: ["earnings", "imports"],
    queryFn: () => getEarningsImports(1, 15).then((r) => r.data),
    enabled: open && canImport,
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
    if (!open) {
      setPreview(null);
      setLocalError(null);
      setClientDebtScan(null);
      setCommitImportOpen(false);
      setCommitWarnings([]);
      setForceAppendWeek(null);
      return;
    }
    applyPreviousWeek();
  }, [open, applyPreviousWeek]);

  useEffect(() => {
    if (preview?.platform) {
      setSelectedPlatform(preview.platform);
    }
  }, [preview?.platform, preview?.importId]);

  const orgImportSettingsQuery = useQuery({
    queryKey: ["earnings", "org-import-settings"],
    queryFn: () => fetchOrgImportSettings().then((r) => r.data),
    enabled: open && canImport,
  });

  const previewMut = useMutation({
    mutationFn: (file: File) =>
      previewEarningsImport(file, {
        glovoCommissionBaseType:
          orgImportSettingsQuery.data?.glovoCommissionBaseType ?? "net_income",
      }),
    onSuccess: (res) => {
      setLocalError(null);
      setForceAppendWeek(null);
      setPreview(res.data);
      if (res.data.weekStart) setPeriodStart(res.data.weekStart);
      if (res.data.weekEnd) setPeriodEnd(res.data.weekEnd);
      if (res.data.existingWeekImport) {
        setPeriodStart(res.data.existingWeekImport.weekStart);
        setPeriodEnd(res.data.existingWeekImport.weekEnd);
      }
    },
    onError: (e) => {
      setPreview(null);
      setLocalError(errMessage(e));
    },
  });

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
    onSuccess: (resp) => {
      setCommitImportOpen(false);
      setPreview(null);
      setForceAppendWeek(null);
      setClientDebtScan(null);
      setLocalError(null);
      void queryClient.invalidateQueries({ queryKey: ["earnings"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      const warnings = resp.data.warnings ?? [];
      if (warnings.length > 0) {
        setCommitWarnings(warnings);
      } else {
        setCommitWarnings([]);
        onClose();
      }
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

  const cancelMut = useMutation({
    mutationFn: (importId: string) => cancelEarningsImport(importId),
    onSuccess: () => {
      setPreview(null);
      setForceAppendWeek(null);
      setClientDebtScan(null);
      setLocalError(null);
      void queryClient.invalidateQueries({ queryKey: ["earnings", "imports"] });
    },
    onError: (e) => setLocalError(errMessage(e)),
  });

  if (!open || !canImport) {
    return null;
  }

  const busy = previewMut.isPending || commitMut.isPending || cancelMut.isPending;
  const confidencePct =
    preview?.detectionConfidence != null ? Math.round(preview.detectionConfidence * 100) : null;
  const periodValidation = validationForPlatform(selectedPlatform);
  const periodValid =
    periodValidation.valid && PROVIDER_OPTIONS.some((o) => o.value === selectedPlatform);
  const appendWeek =
    forceAppendWeek ??
    (preview &&
    shouldAppendToExistingWeek(preview.existingWeekImport, selectedPlatform, periodStart, periodEnd)
      ? preview.existingWeekImport
      : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto my-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-ink">Import earnings</h3>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (preview?.importId) {
                void cancelMut.mutateAsync(preview.importId).finally(() => onClose());
              } else {
                onClose();
              }
            }}
            className="text-slate-400 hover:text-ink-muted text-sm disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <p className="text-xs text-ink-muted mb-4">
          Upload platform reports: CSV, XLSX, ZIP, XML, or PDF. After preview, adjust provider and pay period if
          needed, then confirm import.
        </p>

        {!preview && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label className="inline-flex items-center gap-2 text-sm text-ink cursor-pointer">
              <span className="rounded-lg border border-border px-3 py-1.5 bg-slate-50 hover:bg-slate-100">
                Choose file
              </span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.zip,.xml,.pdf"
                className="hidden"
                disabled={busy}
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  ev.target.value = "";
                  if (f) {
                    const { start, end } = getPreviousWeek();
                    setPeriodStart(start);
                    setPeriodEnd(end);
                    setClientDebtScan(null);
                    void runClientDebtScan(f);
                    previewMut.mutate(f);
                  }
                }}
              />
            </label>
            {previewMut.isPending && (
              <span className="text-sm text-ink-muted flex items-center gap-2">
                <span className="inline-block h-4 w-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                Parsing file…
              </span>
            )}
          </div>
        )}

        {localError && (
          <div className="mb-3 rounded-lg bg-red-50 text-red-800 text-sm px-3 py-2">{localError}</div>
        )}

        {commitWarnings.length > 0 && (
          <div className="mb-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-3">
            <p className="text-xs font-semibold text-amber-900 mb-1">Vehicle return check</p>
            <ul className="text-xs text-amber-900 list-disc list-inside space-y-0.5">
              {commitWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setCommitWarnings([]);
                  onClose();
                }}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
              >
                Acknowledge and close
              </button>
            </div>
          </div>
        )}

        {preview && (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="text-sm text-ink">
              <span className="text-ink-muted">Detected:</span>{" "}
              <span className="font-medium text-ink">
                {providerLabel(preview.platform)}
                {confidencePct != null ? ` (${confidencePct}%)` : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="earnings-provider" className="block text-xs font-medium text-ink mb-1">
                  Provider
                </label>
                <select
                  id="earnings-provider"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                  value={selectedPlatform}
                  disabled={busy}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                >
                  {PROVIDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <ImportPayPeriodFields
                variant="modal"
                periodStart={periodStart}
                periodEnd={periodEnd}
                onPeriodStartChange={setPeriodStart}
                onPeriodEndChange={setPeriodEnd}
                onResetPreviousWeek={applyPreviousWeek}
                validation={periodValidation}
                busy={busy}
              />
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-ink-muted">
              <div>
                <span className="text-ink-muted">File</span>{" "}
                <span className="font-medium text-ink">{preview.fileName}</span>
              </div>
              <div>
                <span className="text-ink-muted">Rows</span>{" "}
                <span className="font-medium text-ink">{preview.totalRows.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-ink-muted">Driver match rate</span>{" "}
                <span className="font-medium text-brand">
                  {(preview.matchRate * 100).toFixed(1)}% ({preview.matchedPreviewCount} / {preview.totalRows})
                </span>
              </div>
            </div>

            {debtSummaryLine && (
              <div className="rounded-lg border border-rose-200 bg-rose-50/95 px-3 py-2 text-sm text-rose-950">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-800">Debt detection</p>
                <p className="mt-0.5 font-medium text-rose-900">{debtSummaryLine}</p>
              </div>
            )}

            {preview.existingWeekImport && (
              <div className="rounded-lg border border-brand/25 bg-brand/5 px-3 py-2 text-sm text-ink">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand">Add to existing week</p>
                <p className="mt-0.5">
                  {providerLabel(preview.existingWeekImport.platform)} already has a completed import for{" "}
                  <span className="font-medium">
                    {preview.existingWeekImport.weekStart} → {preview.existingWeekImport.weekEnd}
                  </span>
                  {preview.existingWeekImport.fileName ? (
                    <>
                      {" "}
                      (<span className="font-medium">{preview.existingWeekImport.fileName}</span>)
                    </>
                  ) : null}
                  . Confirming will append this file into that pay week.
                </p>
              </div>
            )}

            {preview.warnings.length > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                <p className="text-xs font-semibold text-amber-900 mb-1">Data quality</p>
                <ul className="text-xs text-amber-900 list-disc list-inside space-y-0.5">
                  {preview.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-ink mb-2">
                Full data preview ({preview.totalRows.toLocaleString()} rows)
              </p>
              <EarningsImportPreviewVirtualTable
                importId={preview.importId}
                totalRows={preview.totalRows}
                aggregates={preview.aggregates}
                matchedPreviewCount={preview.matchedPreviewCount}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !periodValid}
                onClick={() => setCommitImportOpen(true)}
                className="rounded-lg bg-brand-gradient text-white text-sm font-medium px-4 py-2 hover:opacity-95 disabled:opacity-50"
              >
                {commitMut.isPending
                  ? "Importing…"
                  : preview.existingWeekImport
                    ? "Add to this week…"
                    : "Confirm import (valid rows only)"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => cancelMut.mutate(preview.importId)}
                className="rounded-lg border border-border text-ink text-sm font-medium px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-ink-muted">
              Rows without a date in the file use the period end as trip date. Only rows with a matched driver and a
              gross, net, or TVT amount are written. Transfer commission uses TVT when the column is present, otherwise
              net; cash commission uses daily cash when present. Totals roll into pending driver payments for the period
              above.
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={commitImportOpen && Boolean(preview)}
        onClose={() => !commitMut.isPending && setCommitImportOpen(false)}
        title={appendWeek ? "Add this file to the existing week?" : "Commit this import?"}
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
                <span className="text-ink-muted">Rows:</span>{" "}
                <span className="font-medium tabular-nums text-ink">{preview.totalRows.toLocaleString()}</span>
              </p>
              {preview.aggregates != null && (
                <p>
                  <span className="text-ink-muted">Valid rows (estimate):</span>{" "}
                  <span className="font-semibold tabular-nums text-brand">
                    {(preview.aggregates.valid ?? 0).toLocaleString()}
                  </span>
                </p>
              )}
              {appendWeek && (
                <p className="rounded-lg border border-brand/20 bg-brand/5 px-2 py-1.5 text-xs text-ink">
                  Appends alongside{" "}
                  <span className="font-medium">{appendWeek.fileName ?? "the existing import"}</span>. Payouts for
                  this week will be recomputed from both files.
                </p>
              )}
              {debtSummaryLine && (
                <p className="rounded-lg border border-rose-100 bg-rose-50/90 px-2 py-1.5 text-xs text-rose-900">
                  {debtSummaryLine}
                </p>
              )}
            </div>
          ) : null
        }
        confirmLabel={appendWeek ? "Add to this week" : "Import now"}
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
            appendToExistingWeek: Boolean(appendWeek),
          });
        }}
      />

      <ConfirmDialog
        open={importNavBlocker.state === "blocked"}
        rootClassName="z-[110]"
        onClose={() => importNavBlocker.reset?.()}
        title="Discard unsaved import?"
        description={
          <p>
            You have a staged import preview. Leaving will{" "}
            <span className="font-medium text-ink">delete it on the server</span> and you will need to upload the
            file again.
          </p>
        }
        confirmLabel="Discard and leave"
        cancelLabel="Stay here"
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
