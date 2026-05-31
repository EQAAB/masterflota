import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { CombinedPayoutDetailsContent } from "../../components/earnings/payouts/CombinedPayoutDetailsContent";
import { PayoutDetailsPageHeader } from "../../components/earnings/payouts/PayoutDetailsPageHeader";
import {
  mockDriverName,
  payoutDetailsMockScenarios,
} from "../../components/earnings/payouts/payoutDetailsMockFixtures";
import { btnSecondary } from "../../theme/classNames";

function MockPanel({
  label,
  subtitle,
  scenario,
}: {
  label: string;
  subtitle: string;
  scenario: (typeof payoutDetailsMockScenarios)[number];
}) {
  return (
    <div className="fm-payout-mockup-panel">
      <div className="fm-payout-mockup-panel__label-wrap">
        <h2 className="fm-payout-mockup-panel__label">{label}</h2>
        <p className="fm-payout-mockup-panel__subtitle">{subtitle}</p>
      </div>
      <div className="fm-payout-mockup-panel__frame">
        <PayoutDetailsPageHeader
          driverName={mockDriverName}
          driverId={scenario.row.driver_id}
          compact
          showDownload={false}
        />
        <div className="fm-payout-mockup-panel__content">
          <CombinedPayoutDetailsContent
            row={scenario.row}
            payoutItems={scenario.payoutItems}
            detailsById={scenario.detailsById}
          />
        </div>
      </div>
    </div>
  );
}

export function PayoutDetailsLayoutComparisonPage() {
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [single, multi] = payoutDetailsMockScenarios;

  async function handleExportPng() {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: "#eef1f4",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = "payout-details-layout-comparison.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-[#eef1f4]">
      <div className="shrink-0 border-b border-slate-200/80 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">Payout Details — Layout Comparison</h1>
            <p className="mt-1 text-sm text-slate-600">
              Side-by-side mockup showing how Combined Payout Details adapts for single vs multiple platform drivers.
            </p>
          </div>
          <button
            type="button"
            className={`${btnSecondary} shrink-0 !text-xs`}
            disabled={exporting}
            onClick={() => void handleExportPng()}
          >
            {exporting ? "Exporting…" : "Download mockup PNG"}
          </button>
        </div>
      </div>

      <div ref={exportRef} className="fm-payout-mockup-export flex-1 overflow-x-auto p-4 sm:p-6">
        <div className="fm-payout-mockup-row">
          <MockPanel label={single.label} subtitle={single.subtitle} scenario={single} />
          <MockPanel label={multi.label} subtitle={multi.subtitle} scenario={multi} />
        </div>
      </div>

      <p className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-3 text-center text-xs text-slate-500 sm:px-6">
        Export: screenshot this page at full width for the design mockup image.
      </p>
    </div>
  );
}
