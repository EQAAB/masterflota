import { transitionDefault } from "../../../theme/classNames";
import { EarningsImportTemplatesPanel } from "./EarningsImportTemplatesPanel";
import { EarningsImportUploadIllustration } from "./EarningsImportUploadIllustration";

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

type EarningsImportUploadCardProps = {
  dragActive: boolean;
  isPending: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (file: File | undefined) => void;
  onBrowseClick: () => void;
};

export function EarningsImportUploadCard({
  dragActive,
  isPending,
  fileInputRef,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onBrowseClick,
}: EarningsImportUploadCardProps) {
  return (
    <div className="rounded-[18px] border border-[#E7ECEF] bg-white p-7 shadow-card sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <div
          className={`lg:w-[58%] ${transitionDefault}`}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div
            className={`flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-6 sm:px-6 ${transitionDefault} ${
              dragActive
                ? "border-brand/50 bg-brand-mint/10"
                : "border-brand/25 bg-white hover:border-brand/40 hover:bg-brand-mint/5"
            }`}
          >
            <div className="flex w-full flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
              <div className="hidden sm:block">
                <EarningsImportUploadIllustration />
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <h2 className="text-xl font-semibold tracking-tight text-ink">
                  Drag &amp; drop your file here
                </h2>
                <p className="mt-1.5 text-sm text-ink-muted">
                  or click to{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBrowseClick();
                    }}
                    className="font-medium text-brand hover:underline"
                  >
                    browse
                  </button>
                </p>
                <p className="mt-3 text-sm text-ink-muted">
                  Supports CSV, XLSX, ZIP, XML and PDF files.
                </p>
                <p className="mt-0.5 text-xs text-ink-muted/90">Max file size 25MB per file</p>

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

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBrowseClick();
                  }}
                  disabled={isPending}
                  className={`mt-5 inline-flex items-center gap-2 rounded-xl border border-brand bg-white px-5 py-2.5 text-sm font-medium text-brand ${transitionDefault} hover:bg-brand-mint/20 disabled:opacity-50`}
                >
                  <FolderUploadIcon className="h-4 w-4" />
                  {isPending ? "Parsing…" : "Browse files"}
                </button>

                {isPending && (
                  <div className="mt-4 w-full max-w-xs sm:mx-0">
                    <div className="h-1.5 overflow-hidden rounded-full bg-border">
                      <div className="h-full w-2/5 animate-pulse rounded-full bg-brand" />
                    </div>
                    <p className="mt-2 text-xs text-ink-muted">Validating file…</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-[42%]">
          <EarningsImportTemplatesPanel />
        </div>
      </div>
    </div>
  );
}
