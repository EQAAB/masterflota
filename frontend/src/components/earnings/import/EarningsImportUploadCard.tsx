import { transitionDefault } from "../../../theme/classNames";
import type { UploadPhase } from "../../../hooks/useUploadPhase";
import {
  uploadPhaseDescription,
  uploadPhaseLabel,
  uploadPhaseProgress,
} from "../../../hooks/useUploadPhase";
import { EarningsImportTemplatesPanel } from "./EarningsImportTemplatesPanel";
import { EarningsImportUploadIllustration } from "./EarningsImportUploadIllustration";
import { UploadPhaseSteps } from "./UploadPhaseSteps";

function FolderUploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 11v6m0 0l-3-3m3 3l3-3" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
    </svg>
  );
}

type EarningsImportUploadCardProps = {
  dragActive: boolean;
  isPending: boolean;
  uploadPhase: UploadPhase | null;
  uploadError?: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (file: File | undefined) => void;
  onBrowseClick: () => void;
  onRetry?: () => void;
};

export function EarningsImportUploadCard({
  dragActive,
  isPending,
  uploadPhase,
  uploadError,
  fileInputRef,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onBrowseClick,
  onRetry,
}: EarningsImportUploadCardProps) {
  const hasError = Boolean(uploadError);
  const zoneActive = dragActive || isPending;
  const progress = uploadPhaseProgress(uploadPhase, isPending);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.07)]">
      <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:gap-4">
        <div
          className={`min-h-[168px] ${transitionDefault}`}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <button
            type="button"
            onClick={onBrowseClick}
            disabled={isPending}
            className={`group relative flex h-full min-h-[168px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed px-4 py-3 text-left sm:flex-row sm:items-center sm:gap-4 sm:px-4 sm:py-3 ${transitionDefault} disabled:cursor-not-allowed ${
              hasError
                ? "border-red-200/80 bg-gradient-to-br from-red-50/40 via-white to-white hover:border-red-300"
                : zoneActive
                  ? "border-brand/45 bg-gradient-to-br from-brand-mint/35 via-brand-mint/15 to-white shadow-[inset_0_0_0_1px_rgba(11,122,110,0.06)]"
                  : "border-brand/20 bg-gradient-to-br from-brand-mint/10 via-white to-surface/30 hover:border-brand/35 hover:from-brand-mint/20 hover:shadow-soft"
            }`}
          >
            <EarningsImportUploadIllustration
              active={dragActive}
              processing={isPending}
              error={hasError}
            />

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="text-[15px] font-semibold tracking-tight text-ink sm:text-base">
                {hasError
                  ? "Upload failed"
                  : dragActive && !isPending
                    ? "Drop to upload"
                    : uploadPhaseLabel(uploadPhase, isPending)}
              </h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                {hasError ? (
                  uploadError
                ) : isPending ? (
                  uploadPhaseDescription(uploadPhase, isPending)
                ) : (
                  <>
                    or{" "}
                    <span className="font-medium text-brand group-hover:underline">browse files</span>{" "}
                    from your computer
                  </>
                )}
              </p>
              {!isPending && !hasError && (
                <p className="mt-1.5 text-xs text-ink-muted/85">
                  {uploadPhaseDescription(uploadPhase, isPending)}
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.zip,.xml,.pdf"
                className="hidden"
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  ev.target.value = "";
                  onFileChange(f);
                }}
              />

              {!isPending && !hasError && (
                <span
                  className={`mt-2.5 inline-flex h-10 items-center gap-2 rounded-xl border border-brand/25 bg-white px-4 text-sm font-semibold text-brand shadow-[0_1px_2px_rgba(11,122,110,0.08),0_4px_12px_rgba(11,122,110,0.12)] ${transitionDefault} group-hover:-translate-y-px group-hover:border-brand/40 group-hover:bg-brand-mint/25 group-hover:shadow-[0_2px_8px_rgba(11,122,110,0.16)]`}
                >
                  <FolderUploadIcon className="h-4 w-4" />
                  Browse files
                </span>
              )}

              {hasError && onRetry && (
                <span className="mt-2.5 inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetry();
                      onBrowseClick();
                    }}
                    className={`inline-flex h-9 items-center gap-2 rounded-xl border border-brand/30 bg-white px-3.5 text-sm font-medium text-brand shadow-sm ${transitionDefault} hover:bg-brand-mint/25`}
                  >
                    Try again
                  </button>
                </span>
              )}

              {isPending && (
                <div className="mt-2.5 w-full max-w-sm">
                  <div className="h-1 overflow-hidden rounded-full bg-border/70">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <UploadPhaseSteps phase={uploadPhase} active={isPending} />
                </div>
              )}

              {hasError && (
                <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertIcon className="h-3.5 w-3.5" />
                  Check file format and try again
                </span>
              )}
            </div>
          </button>
        </div>

        <div className="min-h-[168px]">
          <EarningsImportTemplatesPanel />
        </div>
      </div>
    </div>
  );
}
