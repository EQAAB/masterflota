import { btnNavy, btnPrimary } from "../../../theme/classNames";
import { PageHeader } from "../../theme/PageHeader";

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
      />
    </svg>
  );
}

type ReportsPageHeaderProps = {
  csvBusy: boolean;
  pdfBusy: boolean;
  reportsLoading: boolean;
  onExportCsv: () => void;
  onExportPdf: () => void;
};

export function ReportsPageHeader({
  csvBusy,
  pdfBusy,
  reportsLoading,
  onExportCsv,
  onExportPdf,
}: ReportsPageHeaderProps) {
  return (
    <div className="shrink-0 border-b border-border/60 bg-surface-card/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Reports"
          description="Filter first, preview live, then download confidently."
          breadcrumbs={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Earnings", to: "/earnings" },
            { label: "Reports" },
          ]}
          className="border-0 bg-transparent px-0 py-4 sm:py-[1.125rem]"
          actions={
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
              <button
                type="button"
                disabled={csvBusy || reportsLoading}
                onClick={onExportCsv}
                className={`${btnPrimary} gap-2 whitespace-nowrap font-semibold`}
              >
                <DownloadIcon className="h-4 w-4 shrink-0" />
                {csvBusy ? "Preparing CSV…" : "Download CSV"}
              </button>
              <button
                type="button"
                disabled={pdfBusy || reportsLoading}
                onClick={onExportPdf}
                className={`${btnNavy} gap-2 whitespace-nowrap`}
              >
                <DownloadIcon className="h-4 w-4 shrink-0" />
                {pdfBusy ? "Rendering PDF…" : "Download PDF"}
              </button>
            </div>
          }
        />
      </div>
    </div>
  );
}
