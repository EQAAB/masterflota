import { useTranslation } from "react-i18next";
import { btnPrimary, btnSecondary, transitionDefault } from "../../../theme/classNames";
import type { PaymentWeekValidation } from "../../../utils/earningsImportWeek";
import type { Subcontractor } from "../../../api/subcontractors";
import { PayoutWeekNavigator } from "../payouts/PayoutWeekNavigator";

const filterCardClass =
  `rounded-[16px] border border-border/70 bg-white p-4 shadow-soft ${transitionDefault}`;

const filterLabelClass = "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500";

const controlHeight = "h-11 min-h-[44px]";

const filterSelectClass =
  `w-full ${controlHeight} rounded-xl border border-border/80 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none ` +
  "hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20";

const secondaryBtnClass =
  `${btnSecondary} ${controlHeight} !min-h-[44px] rounded-xl px-4 text-sm font-medium shadow-sm hover:shadow-md`;

const primaryBtnClass =
  `${btnPrimary} ${controlHeight} !min-h-[44px] rounded-xl px-4 text-sm font-medium shadow-sm hover:shadow-md`;

type SettlementsFiltersCardProps = {
  periodStart: string;
  periodEnd: string;
  onWeekChange: (start: string, end: string) => void;
  periodValidation: PaymentWeekValidation;
  subcontractorId: string;
  onSubcontractorIdChange: (v: string) => void;
  subcontractors: Subcontractor[];
  subcontractorsLoading: boolean;
  onGenerateReport: () => void;
  onRefresh: () => void;
  onMarkPaid: () => void;
  generatePending: boolean;
  refreshPending: boolean;
  markPaidPending: boolean;
  pendingCount: number;
};

export function SettlementsFiltersCard({
  periodStart,
  periodEnd,
  onWeekChange,
  periodValidation,
  subcontractorId,
  onSubcontractorIdChange,
  subcontractors,
  subcontractorsLoading,
  onGenerateReport,
  onRefresh,
  onMarkPaid,
  generatePending,
  refreshPending,
  markPaidPending,
  pendingCount,
}: SettlementsFiltersCardProps) {
  const { t } = useTranslation();
  const reportDisabled = generatePending || !periodValidation.valid;
  const weekNavDisabled = generatePending || refreshPending;

  return (
    <div className={filterCardClass}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="w-full min-w-0 sm:w-auto sm:min-w-[20rem]">
            <span className={filterLabelClass}>{t("pages.subSettlements.paymentWeekLabel")}</span>
            <PayoutWeekNavigator
              weekStart={periodStart}
              weekEnd={periodEnd}
              onWeekChange={onWeekChange}
              disabled={weekNavDisabled}
              showDateInputs
            />
          </div>
          <div className="w-full sm:w-[220px]">
            <label className={filterLabelClass} htmlFor="settlements-subcontractor">
              {t("pages.subSettlements.subcontractorLabel")}
            </label>
            <select
              id="settlements-subcontractor"
              className={filterSelectClass}
              value={subcontractorId}
              disabled={subcontractorsLoading}
              onChange={(e) => onSubcontractorIdChange(e.target.value)}
            >
              <option value="all">{t("pages.subSettlements.allSubcontractorsOption")}</option>
              {subcontractors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.legal_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {periodValidation.errors.length > 0 && (
          <ul className="list-inside list-disc space-y-0.5 text-xs text-danger" role="alert">
            {periodValidation.errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        )}
        {periodValidation.warnings.length > 0 && (
          <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-800">
            {periodValidation.warnings.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        )}

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border/50 pt-3">
          <button
            type="button"
            disabled={reportDisabled}
            onClick={onGenerateReport}
            className={primaryBtnClass}
          >
            {generatePending ? t("pages.subSettlements.loadingReport") : t("pages.subSettlements.generateReportButton")}
          </button>
          <button type="button" disabled={refreshPending} onClick={onRefresh} className={secondaryBtnClass}>
            {refreshPending ? t("pages.subSettlements.refreshingButton") : t("pages.subSettlements.refreshSettlementDataButton")}
          </button>
          <button
            type="button"
            disabled={markPaidPending || pendingCount === 0}
            onClick={onMarkPaid}
            className={secondaryBtnClass}
          >
            {markPaidPending
              ? t("pages.earningsPayouts.payingRowButton")
              : pendingCount > 0
                ? t("pages.subSettlements.markPaidWithCount", { count: pendingCount })
                : t("pages.subSettlements.markPaidButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
