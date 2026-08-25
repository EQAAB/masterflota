import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const hasError = Boolean(uploadError);
  const zoneActive = dragActive || isPending;
  const progress = uploadPhaseProgress(uploadPhase, isPending);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_rgba(16,24,40,0.05)]">
      <div className="grid gap-3 p-3 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:gap-3.5">
        <div
          className={transitionDefault}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <button
            type="button"
            onClick={onBrowseClick}
            disabled={isPending}
            className={`import-upload-zone group relative flex h-full w-full cursor-pointer flex-col items-center justify-center px-3 py-2.5 text-left sm:flex-row sm:items-center sm:gap-3.5 sm:px-4 sm:py-2.5 disabled:cursor-not-allowed ${
              hasError
                ? "!border-red-200/80 bg-gradient-to-br from-red-50/30 via-white to-white"
                : zoneActive
                  ? "!border-brand/40 bg-gradient-to-br from-brand-mint/30 via-brand-mint/10 to-white"
                  : "bg-gradient-to-br from-brand-mint/[0.07] via-white to-surface/20"
            }`}
          >
            <EarningsImportUploadIllustration
              active={dragActive}
              processing={isPending}
              error={hasError}
            />

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="text-sm font-semibold tracking-tight text-ink">
                {hasError
                  ? t("pages.earningsImport.uploadFailedTitle")
                  : dragActive && !isPending
                    ? t("pages.earningsImport.dropToUploadText")
                    : uploadPhaseLabel(uploadPhase, isPending)}
              </h2>
              <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">
                {hasError ? (
                  uploadError
                ) : isPending ? (
                  uploadPhaseDescription(uploadPhase, isPending)
                ) : (
                  <>
                    {t("pages.earningsImport.orWord")}{" "}
                    <span className="font-medium text-brand group-hover:underline">{t("pages.earningsImport.browseFilesLowercase")}</span>{" "}
                    {t("pages.earningsImport.orBrowseFilesSuffix")}
                  </>
                )}
              </p>
              {!isPending && !hasError && (
                <p className="mt-1 text-[11px] text-ink-muted/80">
                  {t("pages.earningsImport.csvXlsxZipXmlPdfMax25MbText")}
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
                <span className="import-browse-btn mt-2">
                  <FolderUploadIcon className="h-4 w-4 shrink-0" />
                  {t("pages.earningsImport.browseFilesButton")}
                </span>
              )}

              {hasError && onRetry && (
                <span className="mt-2 inline-flex">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetry();
                      onBrowseClick();
                    }}
                    className="import-browse-btn"
                  >
                    {t("pages.earningsImport.tryAgainButton")}
                  </button>
                </span>
              )}

              {isPending && (
                <div className="mt-2 w-full max-w-sm">
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
                <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600">
                  <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                  {t("pages.earningsImport.checkFileFormatHint")}
                </span>
              )}
            </div>
          </button>
        </div>

        <div className="min-h-[148px]">
          <EarningsImportTemplatesPanel />
        </div>
      </div>
    </div>
  );
}
