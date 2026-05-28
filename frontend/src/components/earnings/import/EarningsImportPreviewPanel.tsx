import type { EarningsPreviewResponse } from "../../../api/earningsImport";
import type { PaymentWeekValidation } from "../../../utils/earningsImportWeek";
import { EarningsImportPreviewVirtualTable } from "../EarningsImportPreviewVirtualTable";
import { ImportPayPeriodFields } from "./ImportPayPeriodFields";
import { btnPrimary, btnSecondary, input, sectionLabel } from "../../../theme/classNames";

const PROVIDER_OPTIONS = [
  { value: "uber", label: "Uber" },
  { value: "bolt_taxi", label: "Bolt Taxi" },
  { value: "glovo", label: "Glovo Courier" },
  { value: "bolt_courier", label: "Bolt Delivery" },
  { value: "bolt", label: "Bolt (legacy)" },
  { value: "wolt_courier", label: "Wolt Courier" },
] as const;

type EarningsImportPreviewPanelProps = {
  preview: EarningsPreviewResponse;
  providerLabel: (value: string) => string;
  selectedPlatform: string;
  onPlatformChange: (value: string) => void;
  periodStart: string;
  periodEnd: string;
  onPeriodStartChange: (value: string) => void;
  onPeriodEndChange: (value: string) => void;
  onResetPreviousWeek: () => void;
  periodValidation: PaymentWeekValidation;
  clientCsvRowCount: number | null;
  debtSummaryLine: string | null;
  busy: boolean;
  periodValid: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function EarningsImportPreviewPanel({
  preview,
  providerLabel,
  selectedPlatform,
  onPlatformChange,
  periodStart,
  periodEnd,
  onPeriodStartChange,
  onPeriodEndChange,
  onResetPreviousWeek,
  periodValidation,
  clientCsvRowCount,
  debtSummaryLine,
  busy,
  periodValid,
  onConfirm,
  onCancel,
}: EarningsImportPreviewPanelProps) {
  const confidencePct =
    preview.detectionConfidence != null ? Math.round(preview.detectionConfidence * 100) : null;

  return (
    <div className="space-y-5 rounded-[20px] border border-border/80 bg-white p-5 shadow-card sm:p-6 lg:p-8">
      <div>
        <h2 className="text-lg font-semibold text-ink">Review import preview</h2>
        <p className="mt-1 text-sm text-ink-muted">
          <span className="text-ink-muted">Detected:</span>{" "}
          <span className="font-medium text-ink">
            {providerLabel(preview.platform)}
            {confidencePct != null ? ` (${confidencePct}%)` : ""}
          </span>
        </p>
        {preview.platform === "glovo" && (
          <p className="mt-2 text-xs text-ink-muted">
            Fleet commission calculated on:{" "}
            <span className="font-mono text-ink">{preview.glovoCommissionBaseType ?? "net_income"}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className={sectionLabel}>Provider</span>
          <select
            className={input}
            value={selectedPlatform}
            disabled={busy}
            onChange={(e) => onPlatformChange(e.target.value)}
          >
            {PROVIDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <ImportPayPeriodFields
          periodStart={periodStart}
          periodEnd={periodEnd}
          onPeriodStartChange={onPeriodStartChange}
          onPeriodEndChange={onPeriodEndChange}
          onResetPreviousWeek={onResetPreviousWeek}
          validation={periodValidation}
          busy={busy}
        />
      </div>

      <div className="flex flex-wrap gap-6 rounded-xl border border-border/60 bg-surface-elevated/50 px-4 py-3 text-sm">
        <div>
          <span className="text-ink-muted">File</span>{" "}
          <span className="font-medium text-ink">{preview.fileName}</span>
        </div>
        <div>
          <span className="text-ink-muted">Rows</span>{" "}
          <span className="font-medium tabular-nums text-ink">{preview.totalRows.toLocaleString()}</span>
          {clientCsvRowCount != null && (
            <span className="block text-[11px] text-ink-muted">CSV scan: ~{clientCsvRowCount.toLocaleString()} rows</span>
          )}
        </div>
        <div>
          <span className="text-ink-muted">Match</span>{" "}
          <span className="font-medium text-brand">{(preview.matchRate * 100).toFixed(1)}%</span>
        </div>
      </div>

      {debtSummaryLine && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          <p className="text-xs font-semibold uppercase tracking-wide">Debt detection</p>
          <p className="mt-1 font-medium">{debtSummaryLine}</p>
        </div>
      )}

      {preview.aggregates && (
          <div className="rounded-xl border border-border/60 bg-surface-elevated/50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Import summary</p>
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <span className="text-ink-muted">Total rows in file</span>{" "}
                <span className="font-medium tabular-nums text-ink">
                  {(preview.aggregates.totalLinesInFile ?? preview.totalRows).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-ink-muted">Empty lines skipped</span>{" "}
                <span className="font-medium tabular-nums text-ink">
                  {(preview.aggregates.emptyLinesSkipped ?? 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-ink-muted">Invalid rows skipped</span>{" "}
                <span className="font-medium tabular-nums text-ink">
                  {preview.aggregates.invalid.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-ink-muted">Successfully imported (valid)</span>{" "}
                <span className="font-medium tabular-nums text-brand">
                  {preview.aggregates.valid.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

      {preview.warnings.length > 0 && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
          <p className="text-xs font-semibold text-warning">Data quality</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-ink-muted">
            {preview.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Full data preview ({preview.totalRows.toLocaleString()} rows)
        </p>
        <EarningsImportPreviewVirtualTable
          importId={preview.importId}
          totalRows={preview.totalRows}
          aggregates={preview.aggregates}
          matchedPreviewCount={preview.matchedPreviewCount}
        />
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border/60 pt-5">
        <button
          type="button"
          disabled={busy || !periodValid}
          onClick={onConfirm}
          className={`${btnPrimary} text-sm`}
        >
          Confirm import (valid rows only)
        </button>
        <button type="button" disabled={busy} onClick={onCancel} className={`${btnSecondary} text-sm`}>
          Cancel preview
        </button>
      </div>
    </div>
  );
}

export { PROVIDER_OPTIONS };
