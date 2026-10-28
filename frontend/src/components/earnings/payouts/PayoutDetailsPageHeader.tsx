import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { btnSecondary } from "../../../theme/classNames";

export type PayoutDetailsPageHeaderProps = {
  driverName: string;
  driverId: string;
  backUrl?: string;
  compact?: boolean;
  downloadBusy?: boolean;
  downloadDisabled?: boolean;
  onDownloadReport?: () => void;
  showDownload?: boolean;
  onExplainPayout?: () => void;
  showExplain?: boolean;
  explainDisabled?: boolean;
};

export function PayoutDetailsPageHeader({
  driverName,
  driverId,
  backUrl = "/earnings/payouts",
  compact = false,
  downloadBusy = false,
  downloadDisabled = false,
  onDownloadReport,
  showDownload = true,
  onExplainPayout,
  showExplain = false,
  explainDisabled = false,
}: PayoutDetailsPageHeaderProps) {
  const { t } = useTranslation();
  return (
    <header
      className={`shrink-0 border-b border-border/80 bg-white/90 backdrop-blur-md print:hidden ${
        compact ? "px-3 py-3" : "px-4 py-4 sm:px-6 sm:py-5"
      }`}
    >
      <nav className={`text-xs text-ink-muted ${compact ? "mb-2" : "mb-3"}`}>
        <Link to="/earnings/payouts" className="hover:text-brand hover:underline">
          {t("nav.payouts")}
        </Link>
        <span className="mx-1.5 text-slate-300">/</span>
        <Link to={`/drivers/${driverId}`} className="hover:text-brand hover:underline">
          {driverName}
        </Link>
        <span className="mx-1.5 text-slate-300">/</span>
        <span className="font-medium text-ink">{t("pages.earningsPayouts.detail.combinedPayoutDetailsTitle")}</span>
      </nav>
      <div className={`flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between ${compact ? "gap-2" : "gap-4"}`}>
        <div>
          <Link
            to={backUrl}
            className={`${btnSecondary} !mb-2 !min-h-0 !py-1.5 !px-3 !text-xs inline-flex ${compact ? "!mb-1.5" : "!mb-3"}`}
          >
            ← {t("pages.earningsPayouts.detail.backToPayouts")}
          </Link>
          <h1 className={`font-semibold tracking-tight text-ink ${compact ? "text-base" : "text-xl sm:text-2xl"}`}>
            {t("pages.earningsPayouts.detail.combinedPayoutDetailsTitle")}
          </h1>
          <p className={`max-w-2xl leading-relaxed text-ink-muted ${compact ? "mt-0.5 text-xs" : "mt-1 text-sm"}`}>
            {t("pages.earningsPayouts.detail.combinedPayoutDetailsSubtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden">
          {showExplain && onExplainPayout && (
            <button
              type="button"
              disabled={explainDisabled}
              className={`${btnSecondary} !gap-2 !text-xs`}
              onClick={onExplainPayout}
            >
              <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {t("pages.earningsPayouts.detail.explainPayoutMenu")}
            </button>
          )}
          {showDownload && (
            <button
              type="button"
              disabled={downloadBusy || downloadDisabled}
              className={`${btnSecondary} !gap-2 !text-xs`}
              onClick={onDownloadReport}
            >
              <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {downloadBusy ? t("pages.earningsPayouts.detail.downloading") : t("pages.earningsPayouts.detail.downloadReportMenu")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
