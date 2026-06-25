import { useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Papa from "papaparse";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { usePermission } from "../../../lib/permissions";
import {
  getCommissionByBaseTypeReport,
  getDebtsAging,
  getDebtHistory,
  getDebtsCollectionSummary,
  getEarningsReports,
} from "../../../api/earnings";
import type { EarningsReportRow } from "../../../api/earnings";
import { REPORTS_UUID_RE, reportsErrMessage } from "./reportsDisplayUtils";
import { earningsPlatformLabel } from "../../../utils/earningsPlatformLabel";

export function useReportsPageState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const driverIdFromUrl =
    searchParams.get("driverId")?.trim() || searchParams.get("driver_id")?.trim() || undefined;

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [minVehicleRental, setMinVehicleRental] = useState("");
  const [platform, setPlatform] = useState("");
  const [csvBusy, setCsvBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleRows, setVisibleRows] = useState<EarningsReportRow[]>([]);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const canAccess = usePermission("reports.view");

  const reportFilters = {
    from: from || undefined,
    to: to || undefined,
    q: q.trim() || undefined,
    status: status || undefined,
    driverId: driverIdFromUrl,
    minVehicleRental: minVehicleRental.trim() ? Number(minVehicleRental) : undefined,
    platform: platform || undefined,
  };

  const query = useQuery({
    queryKey: ["earnings", "reports", from, to, q, status, driverIdFromUrl, minVehicleRental, platform],
    queryFn: () => getEarningsReports(reportFilters).then((r) => r.data),
    enabled: canAccess,
  });

  const commissionByBaseQuery = useQuery({
    queryKey: [
      "earnings",
      "reports",
      "commission-base",
      from,
      to,
      q,
      status,
      driverIdFromUrl,
      minVehicleRental,
      platform,
    ],
    queryFn: () => getCommissionByBaseTypeReport(reportFilters).then((r) => r.data),
    enabled: canAccess,
  });

  const rows = query.data?.items ?? [];
  const summary = query.data?.summary;

  const agingQuery = useQuery({
    queryKey: ["earnings", "debts", "aging"],
    queryFn: () => getDebtsAging().then((r) => r.data),
    enabled: canAccess,
  });

  const collectionFrom = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : "";
  const collectionTo = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : "";

  const collectionQuery = useQuery({
    queryKey: ["earnings", "debts", "collection", collectionFrom, collectionTo],
    queryFn: () =>
      getDebtsCollectionSummary({ from: collectionFrom, to: collectionTo }).then((r) => r.data),
    enabled: canAccess && Boolean(collectionFrom && collectionTo && collectionFrom <= collectionTo),
  });

  const debtHistoryQuery = useQuery({
    queryKey: ["earnings", "debts", "history", driverIdFromUrl],
    queryFn: () => getDebtHistory(driverIdFromUrl!).then((r) => r.data),
    enabled: canAccess && Boolean(driverIdFromUrl && REPORTS_UUID_RE.test(driverIdFromUrl)),
  });

  const resetFilters = useCallback(() => {
    setFrom("");
    setTo("");
    setQ("");
    setStatus("");
    setMinVehicleRental("");
    setPlatform("");
  }, []);

  const clearDriverUrlFilter = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("driverId");
    next.delete("driver_id");
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  async function exportCsv() {
    setCsvBusy(true);
    setError(null);
    try {
      const sourceRows = visibleRows.length > 0 ? visibleRows : rows;
      if (sourceRows.length === 0) {
        setError("No rows to export.");
        return;
      }
      const csv = Papa.unparse(
        sourceRows.map((r) => ({
          driver: r.driver_name,
          platform: earningsPlatformLabel(r.earnings_platform),
          platform_id: r.platform_id ?? "",
          period: `${r.period_start_label} - ${r.period_end_label}`,
          total_revenue: r.total_gross_earnings ?? "",
          total_platform_fees: r.total_platform_fees ?? "",
          total_daily_cash: r.total_daily_cash ?? "",
          raw_net_amount: r.raw_net_amount ?? "",
          vehicle_rental: r.vehicle_rental_fee ?? "",
          net_payout: r.net_driver_payout ?? "",
          debt_amount: r.debt_amount ?? "",
          debt_applied_amount: r.debt_applied_amount ?? "",
          remaining_debt_amount: r.remaining_debt_amount ?? "",
          status: r.payment_status,
        })),
      );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "earnings-reports-preview.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(reportsErrMessage(e));
    } finally {
      setCsvBusy(false);
    }
  }

  async function exportPdf() {
    setPdfBusy(true);
    setError(null);
    try {
      if (!previewRef.current) {
        setError("Preview section is not ready yet.");
        return;
      }
      const canvas = await html2canvas(previewRef.current, {
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
      pdf.save("earnings-reports-preview.pdf");
    } catch (e) {
      setError(reportsErrMessage(e));
    } finally {
      setPdfBusy(false);
    }
  }

  return {
    canAccess,
    driverIdFromUrl,
    clearDriverUrlFilter,
    filters: {
      from,
      setFrom,
      to,
      setTo,
      q,
      setQ,
      status,
      setStatus,
      minVehicleRental,
      setMinVehicleRental,
      platform,
      setPlatform,
      resetFilters,
    },
    collectionFrom,
    collectionTo,
    query,
    commissionByBaseQuery,
    agingQuery,
    collectionQuery,
    debtHistoryQuery,
    rows,
    summary,
    error,
    csvBusy,
    pdfBusy,
    exportCsv,
    exportPdf,
    previewRef,
    setVisibleRows,
  };
}

export type ReportsPageState = ReturnType<typeof useReportsPageState>;
