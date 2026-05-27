import { Link } from "react-router-dom";
import type { SubcontractorSettlementDetail } from "../../../../api/subcontractorPayouts";
import { formatCurrency } from "../../../../utils/currency";
import { transitionDefault } from "../../../../theme/classNames";
import { PageHeader } from "../../../theme/PageHeader";
import { settlementDetailStatusDisplay } from "./settlementDetailDisplayUtils";

const outlineBtnClass =
  `inline-flex h-10 items-center justify-center rounded-[10px] border border-border/80 bg-white px-3.5 ` +
  `text-sm font-medium text-slate-800 shadow-sm ${transitionDefault} ` +
  `hover:border-slate-300 hover:bg-slate-50 hover:shadow-md disabled:opacity-50`;

const primaryBtnClass =
  `inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-3.5 ` +
  `text-sm font-medium text-white shadow-sm ${transitionDefault} ` +
  `hover:opacity-95 hover:shadow-md disabled:opacity-50`;

type SettlementDetailHeaderProps = {
  settlement: SubcontractorSettlementDetail["settlement"];
  csvBusy: boolean;
  pdfBusy: boolean;
  canPay: boolean;
  payPending: boolean;
  msg: string | null;
  onExportCsv: () => void;
  onExportPdf: () => void;
  onMarkPaid: () => void;
};

export function SettlementDetailHeader({
  settlement,
  csvBusy,
  pdfBusy,
  canPay,
  payPending,
  msg,
  onExportCsv,
  onExportPdf,
  onMarkPaid,
}: SettlementDetailHeaderProps) {
  const status = settlementDetailStatusDisplay(settlement.status);

  return (
    <div className="shrink-0 border-b border-border/60 bg-surface-card/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          title={settlement.subcontractor_name}
          description={
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <span className="text-sm text-slate-500">
                {settlement.period_start} → {settlement.period_end}
              </span>
              <span
                className={`inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-medium capitalize leading-none ${status.className}`}
              >
                {status.label}
              </span>
            </div>
          }
          breadcrumbs={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Earnings", to: "/earnings" },
            { label: "Subcontractor settlements", to: "/earnings/subcontractors/settlements" },
            { label: settlement.subcontractor_name },
          ]}
          className="border-0 bg-transparent px-0 py-4 sm:py-4 [&_nav]:mb-1.5 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:tracking-tight [&_h1]:text-slate-900"
          actions={
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
              <div className="text-left sm:text-right">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Payable</p>
                <p
                  className="mt-0.5 text-xl font-semibold tabular-nums text-slate-900"
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  {formatCurrency(Number(settlement.payable))}
                </p>
                {settlement.paid_amount != null && settlement.status === "paid" && (
                  <p className="mt-1 text-xs text-slate-500">
                    Paid {formatCurrency(Number(settlement.paid_amount))}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <button
                  type="button"
                  disabled={csvBusy}
                  onClick={onExportCsv}
                  className={outlineBtnClass}
                >
                  {csvBusy ? "Exporting…" : "Export CSV"}
                </button>
                <button
                  type="button"
                  disabled={pdfBusy}
                  onClick={onExportPdf}
                  className={outlineBtnClass}
                >
                  {pdfBusy ? "Exporting…" : "Export PDF"}
                </button>
                {canPay && (
                  <button type="button" disabled={payPending} onClick={onMarkPaid} className={primaryBtnClass}>
                    {payPending ? "Paying…" : "Mark as paid"}
                  </button>
                )}
              </div>
            </div>
          }
        />
        {msg && (
          <p className="pb-3 text-sm text-slate-600" role="status">
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}

/** Shown on error state only */
export function SettlementDetailBackLink() {
  return (
    <Link
      to="/earnings/subcontractors/settlements"
      className="text-sm font-medium text-brand hover:underline"
    >
      Back to settlements
    </Link>
  );
}
