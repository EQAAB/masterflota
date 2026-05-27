import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import Papa from "papaparse";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAuthStore } from "../../store/authStore";
import {
  bulkUpdateSubcontractorPayouts,
  getSubcontractorSettlementDetail,
  type SubcontractorSettlementDetailDriver,
} from "../../api/subcontractorPayouts";
import {
  SettlementDetailBackLink,
  SettlementDetailHeader,
} from "../../components/earnings/settlements/detail/SettlementDetailHeader";
import { SettlementDetailIntegrityBanner } from "../../components/earnings/settlements/detail/SettlementDetailIntegrityBanner";
import { SettlementDetailKpiCards } from "../../components/earnings/settlements/detail/SettlementDetailKpiCards";
import { SettlementDetailDriversTable } from "../../components/earnings/settlements/detail/SettlementDetailDriversTable";

function sumDrivers(rows: SubcontractorSettlementDetailDriver[], key: keyof SubcontractorSettlementDetailDriver) {
  return rows.reduce((acc, r) => acc + Number(r[key] ?? 0), 0);
}

export function SubcontractorSettlementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [csvBusy, setCsvBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const q = useQuery({
    queryKey: ["subcontractor-settlement-detail", id],
    queryFn: () => getSubcontractorSettlementDetail(id!).then((r) => r.data),
    enabled: (user?.role === "admin" || user?.role === "accountant") && !!id,
  });

  const payMut = useMutation({
    mutationFn: () => bulkUpdateSubcontractorPayouts({ ids: [id!], paymentStatus: "paid" }),
    onSuccess: () => {
      setMsg("Marked as paid.");
      void qc.invalidateQueries({ queryKey: ["subcontractor-settlement-detail", id] });
      void qc.invalidateQueries({ queryKey: ["earnings", "subcontractor-settlements"] });
    },
    onError: () => setMsg("Mark paid failed."),
  });

  async function exportCsv() {
    if (!q.data) return;
    setCsvBusy(true);
    try {
      const { settlement, drivers } = q.data;
      const csv = Papa.unparse(
        drivers.map((d) => ({
          driver: d.name,
          gross_incl_tips: d.gross,
          tips: d.tips,
          commission: d.commission,
          vehicle_rent: d.vehicle_rent,
          account_opening_fee: d.account_opening_fee,
          platform_fees: d.platform_fees,
          daily_cash: d.daily_cash,
          custom_deductions: d.custom_deductions,
          custom_additions: d.custom_additions,
          net: d.net,
        })),
      );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `settlement-${settlement.subcontractor_name.replace(/\s+/g, "-")}-${settlement.period_start}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setCsvBusy(false);
    }
  }

  async function exportPdf() {
    if (!printRef.current || !q.data) return;
    setPdfBusy(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const fittedHeight = Math.min(pdfHeight, pdf.internal.pageSize.getHeight() - 10);
      pdf.addImage(imgData, "PNG", 5, 5, pdfWidth - 10, fittedHeight);
      pdf.save(
        `settlement-${q.data.settlement.subcontractor_name.replace(/\s+/g, "-")}-${q.data.settlement.period_start}.pdf`,
      );
    } finally {
      setPdfBusy(false);
    }
  }

  if (user?.role !== "admin" && user?.role !== "accountant") {
    return <p className="p-6 text-slate-500">You do not have access.</p>;
  }

  if (q.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-slate-500">Loading settlement…</p>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="mx-auto max-w-[1600px] p-6 sm:p-8">
        <p className="text-sm text-red-700">Failed to load settlement detail.</p>
        <div className="mt-2">
          <SettlementDetailBackLink />
        </div>
      </div>
    );
  }

  const { settlement, totals, drivers, validation } = q.data;
  const integrityOk = validation.matched && validation.totals_matched;
  const canPay = settlement.status !== "paid";

  const footer = {
    gross: sumDrivers(drivers, "gross"),
    tips: sumDrivers(drivers, "tips"),
    commission: sumDrivers(drivers, "commission"),
    vehicle_rent: sumDrivers(drivers, "vehicle_rent"),
    account_opening_fee: sumDrivers(drivers, "account_opening_fee"),
    platform_fees: sumDrivers(drivers, "platform_fees"),
    daily_cash: sumDrivers(drivers, "daily_cash"),
    custom_deductions: sumDrivers(drivers, "custom_deductions"),
    custom_additions: sumDrivers(drivers, "custom_additions"),
    net: sumDrivers(drivers, "net"),
  };

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <SettlementDetailHeader
        settlement={settlement}
        csvBusy={csvBusy}
        pdfBusy={pdfBusy}
        canPay={canPay}
        payPending={payMut.isPending}
        msg={msg}
        onExportCsv={() => void exportCsv()}
        onExportPdf={() => void exportPdf()}
        onMarkPaid={() => payMut.mutate()}
      />

      <div
        ref={printRef}
        className="mx-auto w-full max-w-[1600px] flex-1 space-y-4 px-4 py-4 sm:px-6 sm:py-5 lg:px-8"
      >
        <SettlementDetailIntegrityBanner integrityOk={integrityOk} validation={validation} />
        <SettlementDetailKpiCards totals={totals} />
        <SettlementDetailDriversTable drivers={drivers} footer={footer} />
      </div>
    </div>
  );
}
